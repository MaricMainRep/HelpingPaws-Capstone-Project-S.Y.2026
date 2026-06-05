import Link from "next/link";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Heart, Shield, Clock, Activity, Video, Bell, Users } from "lucide-react";

const currentYear = new Date().getFullYear();

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Book and manage appointments with ease. Get reminders and real-time updates.",
    color: "bg-[#3a7d6c]/10 text-[#3a7d6c]",
  },
  {
    icon: Heart,
    title: "Health Records",
    description: "Keep track of vaccinations, prescriptions, and medical history in one place.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Video,
    title: "Live Monitoring",
    description: "Watch your pet in real-time through clinic cameras from anywhere.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Receive appointment confirmations, reminders, and important updates.",
    color: "bg-amber-100 text-amber-600",
  },
];

const roles = [
  {
    title: "Pet Owners",
    description: "Book appointments and monitor your pet's health",
    benefits: ["Easy appointment booking", "View medical records", "Live camera access", "Medication reminders"],
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Veterinary Staff",
    description: "Manage appointments and provide better care",
    benefits: ["Appointment management", "Health record creation", "Prescription tracking", "Pet monitoring"],
    color: "from-[#3a7d6c] to-[#57aa95]",
  },
  {
    title: "Administrators",
    description: "Full control over the clinic operations",
    benefits: ["User management", "Analytics dashboard", "Activity logging", "System settings"],
    color: "from-violet-500 to-violet-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <Image
                src="/icon.png"
                alt="HelpingPaws Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="text-xl font-bold text-foreground">HelpingPaws</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-[#3a7d6c] to-[#57aa95] hover:opacity-90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3a7d6c]/10 text-[#3a7d6c] text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-[#3a7d6c] animate-pulse" />
                Trusted by veterinary clinics
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Care for your pets,<br />
                <span className="bg-gradient-to-r from-[#3a7d6c] to-[#57aa95] bg-clip-text text-transparent">
                  simplified.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                The all-in-one platform for veterinary clinics and pet owners. 
                Manage appointments, health records, and monitor your pets in real-time.
              </p>
              <div className="mt-8 flex gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-[#3a7d6c] to-[#57aa95] hover:opacity-90 px-8">
                    Start Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3a7d6c] to-[#57aa95] rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-2xl p-6 text-center">
                    <Calendar className="w-10 h-10 mx-auto text-[#3a7d6c] mb-3" />
                    <p className="font-semibold">Appointments</p>
                    <p className="text-sm text-muted-foreground">Easy booking</p>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-6 text-center">
                    <Heart className="w-10 h-10 mx-auto text-red-500 mb-3" />
                    <p className="font-semibold">Health Records</p>
                    <p className="text-sm text-muted-foreground">Complete history</p>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-6 text-center">
                    <Video className="w-10 h-10 mx-auto text-purple-500 mb-3" />
                    <p className="font-semibold">Live Monitoring</p>
                    <p className="text-sm text-muted-foreground">Real-time video</p>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-6 text-center">
                    <Bell className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                    <p className="font-semibold">Notifications</p>
                    <p className="text-sm text-muted-foreground">Stay updated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern veterinary care
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 border border-border hover:border-[#3a7d6c]/30 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              For everyone
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for pet owners, staff, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <Card key={index} className="overflow-hidden border border-border hover:shadow-lg transition-all">
                <div className={`h-2 bg-gradient-to-r ${role.color}`} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{role.title}</h3>
                  <p className="text-muted-foreground mb-4">{role.description}</p>
                  <ul className="space-y-2">
                    {role.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3a7d6c]" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#3a7d6c] to-[#57aa95] rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
              <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to get started?
              </h3>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of pet owners and veterinary clinics using HelpingPaws 
                to streamline their operations.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="px-8">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <Image
                  src="/icon.png"
                  alt="HelpingPaws Logo"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="font-semibold text-foreground">HelpingPaws</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} HelpingPaws. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
