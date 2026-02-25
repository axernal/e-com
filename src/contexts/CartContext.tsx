import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(id, name, price, image_url)")
      .eq("user_id", user.id);
    if (!error && data) {
      setItems(data.map((item: any) => ({ ...item, product: item.products })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string) => {
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + 1);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: 1 });
      await fetchCart();
    }
    toast.success("Added to cart");
    setIsOpen(true);
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) { await removeFromCart(itemId); return; }
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
