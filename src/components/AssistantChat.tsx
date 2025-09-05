"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, BrainCircuit, User } from "lucide-react";
import { showError, showLoading, dismissToast } from "@/utils/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Message = {
  type: "user" | "ai";
  text: string;
};

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = { type: "user", text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsSending(true);

    const toastId = showLoading("Enviando pergunta para a IA...");

    try {
      const response = await fetch("https://webhook.usoteste.shop/webhook/assistente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mensagem: messageToSend }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: Message = { type: "ai", text: data.mensagem || "Não consegui obter uma resposta da IA." };
      setMessages((prev) => [...prev, aiMessage]);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro ao comunicar com a IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setMessages((prev) => [...prev, { type: "ai", text: "Desculpe, houve um erro ao processar sua solicitação." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[calc(100vh-160px)] flex flex-col">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-xl font-semibold">Assistente AI para Mecânicos</CardTitle>
        <CardDescription>Tire suas dúvidas sobre problemas automotivos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                Comece uma conversa com o assistente AI!
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.type === "ai" && (
                  <div className="flex-shrink-0 p-2 bg-blue-100 text-blue-800 rounded-full">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.type === "user" && (
                  <div className="flex-shrink-0 p-2 bg-gray-200 text-gray-800 rounded-full">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            placeholder="Pergunte algo sobre problemas no carro..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}