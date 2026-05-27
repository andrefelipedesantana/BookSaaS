import db from "./db"
import { compareSync } from "bcrypt-ts"

type User = {
    name: string;
    email: string;
    password?: string;
}


export async function findUserByCredentials(email: string, password: string): Promise<User | null> {
    const user = await db.user.findFirst({
        where: {
            email: email,
        }
    })

    if (!user) {
        return null
    }

    const isPasswordValid = compareSync(password, user.password)

    if (isPasswordValid) {
        return {
            name: user.name,
            email: user.email,
        }
    }
    return null
}