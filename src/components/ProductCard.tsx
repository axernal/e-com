import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Plus } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

const ProductCard = ({ id, name, price, image_url, category }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <div className="group animate-fade-in">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-3">
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-10 w-10 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
          onClick={() => addToCart(id)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-1">
        {category && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</p>
        )}
        <h3 className="text-sm font-medium">{name}</h3>
        <p className="text-sm text-muted-foreground">₹{price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductCard;
