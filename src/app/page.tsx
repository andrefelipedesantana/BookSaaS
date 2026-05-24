import Image from "next/image";
import logo from "@/app/assets/logo.svg"
import mulher from "@/app/assets/mulher.png"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <main>
      <section className="container mx-auto text-center pb-20">
        <nav className="flex justify-between items-center py-4">
          <Image src={logo} alt="logo" />
          <div className="flex items-center gap-4">
            <Button variant={'link'}>Funcionamento</Button>
            <Button variant={'link'}>Preço</Button>
            <Button variant={'bg-white'}>Login</Button>
          </div>
        </nav>
        <h1 className="text-5xl md:text-6xl font-bold mt-16">Simplifique seus estudos</h1>
        <p className="text-gray-500 mt-4 text-lg md:text-xl max-w-2xl mx-auto">Deixe que nós fazermos a curadoria para você. Assine nossa plataforma e receba todos os meses um ebook novo de programação.</p>
        <form className="mt-10">
          <div className="flex gap-3 justify-center ">
            <Input
              type="email"
              placeholder="Coloque seu email"
              className="max-w-sm border-gray-300 border rounded-lg h-12 px-4 text-base"
            />
            <Button type="submit" className="h-12 px-8 text-base">Assine agora</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Comece sua assinatura agora mesmo</p>
        </form>
      </section>
      <section className="bg-white py-16">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center">Como funciona</h2>
          <div className="flex items-center justify-center gap-16 mt-16">
            <Image src={mulher} alt="mulher carregando caixas" className="max-w-xs md:max-w-sm" />
            <ul className="text-lg md:text-xl text-muted-foreground space-y-6 w-full max-w-sm">
              <li className="flex items-center justify-between gap-4">Acesso a 1 ebook por mês <Check className="text-green-600 w-6 h-6" /></li>
              <li className="flex items-center justify-between gap-4">Curadoria especial <Check className="text-green-600 w-6 h-6" /></li>
              <li className="flex items-center justify-between gap-4">Cancele quando quiser <Check className="text-green-600 w-6 h-6" /></li>
            </ul>
          </div>
        </div>
      </section>
      <section className="text-center py-16">
        <h2 className="text-4xl md:text-5xl font-bold mt-16">Preço simples e transparente</h2>
        <p className="text-gray-500 mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          Pra que inúmeros planos quando nós sabemos exatamente o que é melhor para você? Assine o nosso plano mensal Pro Premium VIP e garanta mensalmente um ebook novo de programação. E por menos de um café por dia.
        </p>
        <Card className="w-[350px] mx-auto mt-10 text-left">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Plano Pro Premium VIP</CardTitle>
            <CardDescription>Tudo que você precisa pros seus estudos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold mb-8 mt-4">R$29<span className="font-normal text-muted-foreground text-lg">/mês</span></p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground"> <Check className="text-green-600 w-5 h-5" />Acesso a 1 ebook por mês</li>
              <li className="flex items-center gap-3 text-muted-foreground"> <Check className="text-green-600 w-5 h-5" />Acesso a mais de 100 livros</li>
              <li className="flex items-center gap-3 text-muted-foreground"> <Check className="text-green-600 w-5 h-5" />Acesso ilimitado</li>
              <li className="flex items-center gap-3 text-muted-foreground"> <Check className="text-green-600 w-5 h-5" />Cancele quando quiser</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-11 text-base">Assine agora</Button>
          </CardFooter>
        </Card>
      </section>
      <section className="bg-white text-center py-16">
        <h2 className="text-4xl md:text-5xl font-bold mt-16">Pronto para mudar sua vida</h2>
        <p className="text-gray-500 mt-4 text-lg md:text-xl max-w-2xl mx-auto">Faça como milhares de outras pessoas. Assine nosso produto e tenha garantido seus estudos </p>
        <Button className="mt-10 w-full max-w-xs h-12 text-lg">Assine agora</Button>
        <p className="text-xs text-muted-foreground mt-2">Comece sua assinatura agora mesmo. Cancele quando quiser</p>
        <footer className="mt-16 border-t border-gray-300 pt-10">
          <Image src={logo} alt="logo" className="mx-auto" />
          <p className="text-muted-foreground mt-2">@2026 LivroSaaS. Todos os direitos reservados</p>
        </footer>
      </section>
    </main>
  );
}
