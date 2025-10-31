import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface InstitutionCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  image?: string;
}

export const InstitutionCard = ({ title, description, href, icon, image }: InstitutionCardProps) => {
  return (
    <a href={href} className="block group">
      <Card className="p-8 h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary bg-card">
        <div className="flex flex-col items-center text-center space-y-6">
          {image ? (
            <div className="w-32 h-32 flex items-center justify-center">
              <img src={image} alt={title} className="w-full h-full object-contain" />
            </div>
          ) : icon ? (
            <div className="p-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              {icon}
            </div>
          ) : null}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
            <span>Besök</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </a>
  );
};
