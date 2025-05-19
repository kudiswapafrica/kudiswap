import express from "express";
import requestLogger from "./middlewares/requestLogger";
import routes from "./routes";


const app = express();
const port = 3000;

app.use(express.json());
app.use(requestLogger);
app.use(routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});