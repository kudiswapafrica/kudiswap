"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requestLogger_1 = __importDefault(require("./middlewares/requestLogger"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const port = 8080;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(requestLogger_1.default);
app.use(routes_1.default);
// app.set("trust proxy", true);
// app.use(rateLimiter);
app.get("/", (req, res) => {
    return res.json({ message: "Config.port" });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
