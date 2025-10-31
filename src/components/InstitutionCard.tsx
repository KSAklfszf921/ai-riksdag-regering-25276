import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
interface InstitutionCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  image?: string;
}
export const InstitutionCard = ({
  title,
  description,
  href,
  icon,
  image
}: InstitutionCardProps) => {
  return <a href={href} className="block group" target="_blank" rel="noopener noreferrer">
      <Card className="p-8 md:p-10 h-full transition-all duration-300 hover:shadow-2xl border border-border bg-card group-hover:border-primary/50">
        <div className="flex flex-col items-center text-center space-y-6">
          {image ? <div className="w-40 h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img src={image} alt={title} className="w-full h-full object-contain" />
            </div> : icon ? <div className="p-6 rounded-full bg-muted text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              {icon}
            </div> : null}
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-foreground transition-colors md:text-4xl">
              {title}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm transition-all group-hover:gap-3 pt-2">
            <span className="text-xl">Öppna</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </a>;
};