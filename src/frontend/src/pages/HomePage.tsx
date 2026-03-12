import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Package,
  Printer,
  Shield,
  Star,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Printer,
    title: "High-Quality Prints",
    description:
      "Professional-grade 3D printing with precision and detail for every project.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    description:
      "Quick production times without compromising on quality or accuracy.",
  },
  {
    icon: Star,
    title: "Custom Designs",
    description:
      "Bring your ideas to life with fully customized 3D printed creations.",
  },
  {
    icon: Shield,
    title: "Durable Materials",
    description:
      "Premium filaments and resins for long-lasting, functional parts.",
  },
  {
    icon: Package,
    title: "Wide Range of Products",
    description:
      "From prototypes to figurines, phone cases to architectural models.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/generated/creative-prints-logo-transparent.dim_200x200.png"
                  alt="Creative Prints and Design"
                  className="h-14 w-14 object-contain"
                />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Creative Prints and Design
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
                Bring Your Ideas to{" "}
                <span className="text-primary">Life in 3D</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Professional 3D printing services for prototypes, custom parts,
                figurines, jewelry, and more. High quality, fast turnaround, and
                competitive pricing.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/store">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/custom-order">
                    Custom Order <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl" />
                <img
                  src="/assets/generated/hero-3d-printer.dim_800x600.jpg"
                  alt="3D Printer in action"
                  className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Why Choose Creative Prints and Design?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              We combine cutting-edge technology with craftsmanship to deliver
              exceptional 3D printed products.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border border-border hover:border-primary/40 transition-colors group"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Start Your Project?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Whether you need a one-of-a-kind custom piece or want to browse our
            ready-made products, we're here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/store">
                Browse Store <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/custom-order">
                Request Custom Order <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
