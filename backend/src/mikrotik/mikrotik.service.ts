import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerStatus } from '@prisma/client';
import * as net from 'net';
import * as tls from 'tls';
import { PrismaService } from '../prisma/prisma.service';

type RouterOsRow = Record<string, string>;

class RouterOsConnection {
  private socket: net.Socket | tls.TLSSocket;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];

  constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;

    this.socket.on('data', (data) => {
      this.buffer = Buffer.concat([this.buffer, data]);
      this.waiters.forEach((resolve) => resolve());
      this.waiters = [];
    });
  }

  private waitForData(): Promise<void> {
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private encodeLength(length: number): Buffer {
    if (length < 0x80) {
      return Buffer.from([length]);
    }

    if (length < 0x4000) {
      return Buffer.from([(length >> 8) | 0x80, length & 0xff]);
    }

    if (length < 0x200000) {
      return Buffer.from([
        (length >> 16) | 0xc0,
        (length >> 8) & 0xff,
        length & 0xff,
      ]);
    }

    if (length < 0x10000000) {
      return Buffer.from([
        (length >> 24) | 0xe0,
        (length >> 16) & 0xff,
        (length >> 8) & 0xff,
        length & 0xff,
      ]);
    }

    return Buffer.from([
      0xf0,
      (length >> 24) & 0xff,
      (length >> 16) & 0xff,
      (length >> 8) & 0xff,
      length & 0xff,
    ]);
  }

  private async readByte(): Promise<number> {
    while (this.buffer.length < 1) {
      await this.waitForData();
    }

    const value = this.buffer[0];
    this.buffer = this.buffer.subarray(1);
    return value;
  }

  private async readLength(): Promise<number> {
    const first = await this.readByte();

    if ((first & 0x80) === 0x00) {
      return first;
    }

    if ((first & 0xc0) === 0x80) {
      const second = await this.readByte();
      return ((first & ~0xc0) << 8) + second;
    }

    if ((first & 0xe0) === 0xc0) {
      const second = await this.readByte();
      const third = await this.readByte();
      return ((first & ~0xe0) << 16) + (second << 8) + third;
    }

    if ((first & 0xf0) === 0xe0) {
      const second = await this.readByte();
      const third = await this.readByte();
      const fourth = await this.readByte();

      return (
        ((first & ~0xf0) << 24) +
        (second << 16) +
        (third << 8) +
        fourth
      );
    }

    const second = await this.readByte();
    const third = await this.readByte();
    const fourth = await this.readByte();
    const fifth = await this.readByte();

    return (second << 24) + (third << 16) + (fourth << 8) + fifth;
  }

  private async readWord(): Promise<string> {
    const length = await this.readLength();

    if (length === 0) {
      return '';
    }

    while (this.buffer.length < length) {
      await this.waitForData();
    }

    const word = this.buffer.subarray(0, length).toString();
    this.buffer = this.buffer.subarray(length);

    return word;
  }

  private async readSentence(): Promise<string[]> {
    const words: string[] = [];

    while (true) {
      const word = await this.readWord();

      if (word === '') {
        break;
      }

      words.push(word);
    }

    return words;
  }

  private writeWord(word: string) {
    const data = Buffer.from(word);
    this.socket.write(this.encodeLength(data.length));
    this.socket.write(data);
  }

  private writeSentence(words: string[]) {
    for (const word of words) {
      this.writeWord(word);
    }

    this.writeWord('');
  }

  private parseRow(sentence: string[]): RouterOsRow {
    const row: RouterOsRow = {};

    for (const word of sentence) {
      if (!word.startsWith('=')) continue;

      const secondEqual = word.indexOf('=', 1);

      if (secondEqual === -1) continue;

      const key = word.slice(1, secondEqual);
      const value = word.slice(secondEqual + 1);

      row[key] = value;
    }

    return row;
  }

  async login(username: string, password: string) {
    await this.talk('/login', [`=name=${username}`, `=password=${password}`]);
  }

  async talk(command: string, params: string[] = []): Promise<RouterOsRow[]> {
    this.writeSentence([command, ...params]);

    const rows: RouterOsRow[] = [];

    while (true) {
      const sentence = await this.readSentence();

      if (sentence.length === 0) {
        continue;
      }

      const type = sentence[0];

      if (type === '!done') {
        break;
      }

      if (type === '!trap') {
        const trap = this.parseRow(sentence);
        throw new Error(trap.message || 'MikroTik API trap error');
      }

      if (type === '!fatal') {
        throw new Error(sentence.join(' '));
      }

      if (type === '!re') {
        rows.push(this.parseRow(sentence));
      }
    }

    return rows;
  }

  close() {
    this.socket.destroy();
  }
}

@Injectable()
export class MikrotikService {
  constructor(private readonly prisma: PrismaService) {}

  async testTcpConnection(host: string, port: number, timeout = 5000) {
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      const socket = new net.Socket();

      const done = (success: boolean, message: string) => {
        socket.destroy();
        resolve({ success, message });
      };

      socket.setTimeout(timeout);

      socket.once('connect', () => {
        done(true, `Connected to MikroTik API at ${host}:${port}`);
      });

      socket.once('timeout', () => {
        done(false, `Connection timeout to ${host}:${port}`);
      });

      socket.once('error', (error) => {
        done(false, error.message);
      });

      socket.connect(port, host);
    });
  }

  private async connect(routerId: string): Promise<RouterOsConnection> {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    const socket = await new Promise<net.Socket | tls.TLSSocket>(
      (resolve, reject) => {
        const onError = (error: Error) => reject(error);

        if (router.ssl) {
          const tlsSocket = tls.connect(
            {
              host: router.host,
              port: router.apiPort,
              rejectUnauthorized: false,
            },
            () => resolve(tlsSocket),
          );

          tlsSocket.once('error', onError);
        } else {
          const netSocket = net.connect(
            {
              host: router.host,
              port: router.apiPort,
            },
            () => resolve(netSocket),
          );

          netSocket.once('error', onError);
        }
      },
    );

    const connection = new RouterOsConnection(socket);
    await connection.login(router.username, router.password);

    return connection;
  }

  async getProfiles(routerId: string) {
    const connection = await this.connect(routerId);

    try {
      return await connection.talk('/ppp/profile/print');
    } finally {
      connection.close();
    }
  }

  async getSecrets(routerId: string) {
    const connection = await this.connect(routerId);

    try {
      return await connection.talk('/ppp/secret/print');
    } finally {
      connection.close();
    }
  }

  async getActiveSessions(routerId: string) {
    const connection = await this.connect(routerId);

    try {
      return await connection.talk('/ppp/active/print');
    } finally {
      connection.close();
    }
  }

  private parseSpeed(profileName: string) {
    const match = profileName.match(/(\d+)/);
    const speed = match ? Number(match[1]) : 1;

    return {
      downloadMbps: speed,
      uploadMbps: speed,
    };
  }

  async importFromRouter(routerId: string) {
    const connection = await this.connect(routerId);

    try {
      const profiles = await connection.talk('/ppp/profile/print');
      const secrets = await connection.talk('/ppp/secret/print');
      const activeSessions = await connection.talk('/ppp/active/print');

      const identityRows = await connection.talk('/system/identity/print');
      const resourceRows = await connection.talk('/system/resource/print');

      const identity = identityRows[0]?.name;
      const resource = resourceRows[0];

      await this.prisma.router.update({
        where: { id: routerId },
        data: {
          identity,
          model: resource?.['board-name'],
          version: resource?.version,
          active: true,
        },
      });

      let importedProfiles = 0;
      let importedSecrets = 0;
      let updatedSecrets = 0;

      for (const profile of profiles) {
        const name = profile.name;

        if (!name) continue;

        const speed = this.parseSpeed(name);

        await this.prisma.internetPackage.upsert({
          where: { name },
          update: {
            mikrotikProfile: name,
            active: true,
          },
          create: {
            name,
            downloadMbps: speed.downloadMbps,
            uploadMbps: speed.uploadMbps,
            price: 0,
            mikrotikProfile: name,
            active: true,
          },
        });

        importedProfiles++;
      }

      for (const secret of secrets) {
        const username = secret.name;
        const password = secret.password || '';
        const profileName = secret.profile || 'default';

        if (!username) continue;

        const speed = this.parseSpeed(profileName);

        const pkg = await this.prisma.internetPackage.upsert({
          where: { name: profileName },
          update: {
            mikrotikProfile: profileName,
            active: true,
          },
          create: {
            name: profileName,
            downloadMbps: speed.downloadMbps,
            uploadMbps: speed.uploadMbps,
            price: 0,
            mikrotikProfile: profileName,
            active: true,
          },
        });

        const disabled = String(secret.disabled || 'false').toLowerCase() === 'true';

        const existingPpp = await this.prisma.pppAccount.findUnique({
          where: { username },
        });

        if (existingPpp) {
          await this.prisma.customer.update({
            where: { id: existingPpp.customerId },
            data: {
              packageId: pkg.id,
              routerId,
              status: disabled ? CustomerStatus.SUSPENDED : CustomerStatus.ACTIVE,
              pppAccount: {
                update: {
                  routerId,
                  username,
                  password,
                  profile: profileName,
                  service: secret.service || 'pppoe',
                  localIp: secret['local-address'],
                  remoteIp: secret['remote-address'],
                  callerId: secret['caller-id'],
                  disabled,
                  lastSyncAt: new Date(),
                },
              },
            },
          });

          updatedSecrets++;
        } else {
          await this.prisma.customer.create({
            data: {
              customerNo: `IMP-${username}`,
              fullName: secret.comment || username,
              phone: 'N/A',
              routerId,
              packageId: pkg.id,
              status: disabled ? CustomerStatus.SUSPENDED : CustomerStatus.ACTIVE,
              notes: secret.comment,
              pppAccount: {
                create: {
                  routerId,
                  username,
                  password,
                  profile: profileName,
                  service: secret.service || 'pppoe',
                  localIp: secret['local-address'],
                  remoteIp: secret['remote-address'],
                  callerId: secret['caller-id'],
                  disabled,
                  lastSyncAt: new Date(),
                },
              },
            },
          });

          importedSecrets++;
        }
      }

      return {
        success: true,
        routerId,
        importedProfiles,
        importedSecrets,
        updatedSecrets,
        activeSessions: activeSessions.length,
      };
    } finally {
      connection.close();
    }
  }
}