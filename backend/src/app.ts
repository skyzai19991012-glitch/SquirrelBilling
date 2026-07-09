import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        application: "Squirrel Networks Billing",
        version: "1.0.0",
        status: "Running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        server: "Online",
        database: "Not Connected",
        mikrotik: "Not Connected"
    });
});

export default app;
