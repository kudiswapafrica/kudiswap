import dotenv from 'dotenv';

dotenv.config();
export const Config = {
    port: process.env.PORT,
    dbURI: process.env.DB_URI,
    jwtSecret: process.env.JWT_SECRET,
    env: process.env.NODE_ENV || 'development',

}