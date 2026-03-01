import { Link } from '@tanstack/react-router';
import { Printer, Layers, Zap, Package } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Printer,
      title: 'High-Quality Printing',
      description: 'State-of-the-art 3D printers delivering exceptional detail and precision',
    },
    {
      icon: Layers,
      title: 'Multiple Materials',
      description: 'Wide range of materials including PLA, ABS, PETG, and specialty filaments',
    },
    {
      icon: Zap,
      title: 'Fast Turnaround',
      description: 'Quick production times without compromising on quality',
    },
    {
      icon: Package,
      title: 'Custom Orders',
      description: 'Upload your own designs or work with us to create something unique',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your Ideas Into{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Reality
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Professional 3D printing services for creators, designers, and innovators. 
                From prototypes to finished products, we bring your vision to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/store"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                >
                  Browse Store
                </Link>
                <Link
                  to="/custom-order"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  Custom Order
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl"></div>
              <img
                src="/assets/generated/hero-3d-printer.dim_800x600.jpg"
                alt="3D Printer in action"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Creative Prints and Design?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge technology with expert craftsmanship to deliver outstanding results
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border/50"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-12 text-center border border-border/50">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore our gallery of past projects or submit your custom design today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/gallery"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View Gallery
              </Link>
              <Link
                to="/custom-order"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                Submit Custom Order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
