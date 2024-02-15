import pg from "pg"

const Pool = pg.Pool
const pool = new Pool(
    {
        user: "postgres",
        host: "localhost",
        database: "sooda",
        password: "Stevefox1!",
        port: 5433
    }
);

export default pool