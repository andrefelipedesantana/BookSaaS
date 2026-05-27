"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Form from "next/form"
import { useActionState } from "react"
import loginAction from "./loginAction"


export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, null);


    return (

        <>
            {state?.sucess === false && (
                <div className="bg-red-100 border-red-400 border text-red-700 px-4 py-3 rounded mb-4 text-center">
                    <strong className="font-bold">Ops!</strong>
                    <span className="block">{state?.message}</span>
                </div>
            )}

            <Form action={formAction}>
                <div>
                    <Label>Email</Label>
                    <Input type="email" name="email" placeholder="eu@exemplo.com" />
                </div>
                <div>
                    <Label>Senha</Label>
                    <Input type="password" name="password" placeholder="********" />
                </div>
                <div>
                    <Button className="w-full mt-6" type="submit">
                        Login
                    </Button>
                </div>
            </Form>
        </>
    )
}