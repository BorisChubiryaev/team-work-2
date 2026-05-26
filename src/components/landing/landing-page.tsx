"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Brain,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

export function LandingPage() {
  const { setCurrentPage, setInviteCode } = useAppStore();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Еженедельные отчеты",
      description:
        "Создавайте и отправляйте еженедельные отчеты. Менеджер проверяет, комментирует и утверждает.",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-аналитика",
      description:
        "Искусственный интеллект анализирует отчеты, выявляет тренды и предлагает рекомендации.",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Дашборды",
      description:
        "Наглядные графики и метрики для руководителей и сотрудников в реальном времени.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Ретроспективы",
      description:
        "Проводите ретро-встречи с AI-фасилитацией для непрерывного улучшения процессов.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Создайте команду",
      desc: "Зарегистрируйтесь и создайте рабочую команду или присоединитесь по приглашению",
    },
    {
      num: "02",
      title: "Ведите отчеты",
      desc: "Сотрудники регулярно заполняют еженедельные отчеты о проделанной работе",
    },
    {
      num: "03",
      title: "Анализируйте с ИИ",
      desc: "Получайте автоматические сводки, рекомендации и инсайты от искусственного интеллекта",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">TeamFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCurrentPage("auth")}>
              Войти
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setCurrentPage("auth")}
            >
              Начать работу
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-управление командой нового поколения
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Умное управление
              <br />
              <span className="text-emerald-600">командой с ИИ</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              TeamFlow объединяет отчеты, проекты, ретроспективы и AI-аналитику
              в одном месте. Автоматизируйте рутину и фокусируйтесь на главном.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 h-12"
                onClick={() => setCurrentPage("auth")}
              >
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12"
                onClick={() => {
                  const el = document.getElementById("features");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Узнать больше
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { value: "500+", label: "Команд" },
              { value: "10K+", label: "Отчетов" },
              { value: "95%", label: "Довольных" },
              { value: "24/7", label: "AI-поддержка" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Всё для управления командой
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Комплексное решение, которое заменяет десятки инструментов
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-emerald-100 dark:border-emerald-900/30">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Как это работает
            </h2>
            <p className="text-lg text-muted-foreground">
              Три простых шага к эффективной команде
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-emerald-200 dark:text-emerald-900/50 mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-emerald-600 rounded-2xl p-8 sm:p-12 text-center text-white"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Готовы начать?
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам команд, которые уже используют TeamFlow
              для повышения эффективности
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 h-12"
                onClick={() => setCurrentPage("auth")}
              >
                Создать команду
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-12"
                onClick={() => setCurrentPage("auth")}
              >
                Присоединиться
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">TeamFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 TeamFlow. Умное управление командой.
          </p>
        </div>
      </footer>
    </div>
  );
}
