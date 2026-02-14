import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, GraduationCap } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Sign up and list the skills you want to teach and learn.',
  },
  {
    icon: Search,
    title: 'Find Your Match',
    description: 'Browse through peers and find the perfect learning partner.',
  },
  {
    icon: GraduationCap,
    title: 'Start Learning',
    description: 'Join live sessions, earn credits, and grow your skills together.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Get started in three simple steps
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="relative">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 relative">
                    <Icon className="h-8 w-8 text-white" />
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
