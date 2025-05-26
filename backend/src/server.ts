import express from "express";
import requestLogger from "./middlewares/requestLogger";
import routes from "./routes";
import rateLimiter from "./middlewares/rateLimiter";
import { Config } from "./config/config";


const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(routes);
// app.set("trust proxy", true);
// app.use(rateLimiter);

app.get("/", (req, res)=>{
    return res.json({message:"Config.port"})
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
