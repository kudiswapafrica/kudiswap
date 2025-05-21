import { Pool } from "pg";
import { Config } from "./config";



const pool = new Pool({
  connectionString: Config.dbURI,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("🚀 Connected to PostgreSQL database!"))
  .catch(err => console.error("❌ Database connection error:", err));

export default pool;