"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import registerAction from "./registerAction";
import Form from "next/form"
import { redirect } from "next/navigation";

export default function RegisterForm() {
    const [state, formAction, isPending] = useActionState(registerAction, null);


    if (state?.sucess) {
        redirect('/login');
    }

    return (

        <>
            {state?.sucess === false && (
                <div className="bg-red-100 border-red-400 border text-red-700 px-4 py-3 rounded mb-4 text-center">
                    <strong className="font-bold">Ops!</strong>
                    <span className="block">{state?.message}</span>
                </div>
            )}

            {state?.sucess === true && (
                <div className="bg-green-100 border-green-400 border text-green-700 px-4 py-3 rounded mb-4 text-center">
                    <strong className="font-bold">Sucesso!</strong>
                    <span className="block">{state?.message}</span>
                </div>
            )}

            <Form action={formAction}>
                <div>
                    <Label>Nome</Label>
                    <Input type="text" name="name" placeholder="Fulano de Tal" />
                </div>
                <div>
                    <Label>Email</Label>
                    <Input type="email" name="email" placeholder="eu@exemplo.com" />
                </div>
                <div>
                    <Label>Senha</Label>
                    <Input type="password" name="password" placeholder="********" />
                </div>
                <div>
                    <Button disabled={isPending} className="w-full mt-6" type="submit">
                        Registrar
                    </Button>
                </div>
            </Form>
        </>
    )
}