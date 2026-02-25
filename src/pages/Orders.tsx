import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: { name: string; image_url: string | null };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }

    const fetchOrders = async () => {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!ordersData) { setLoading(false); return; }

      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from("order_items")
            .select("id, quantity, price_at_purchase, products(name, image_url)")
            .eq("order_id", order.id);
          return { ...order, items: (items || []) as any };
        })
      );

      setOrders(ordersWithItems);
      setLoading(false);
    };

    fetchOrders();
  }, [user, navigate]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "pending": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-serif">Order History</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg">No orders yet</p>
          <p className="text-sm">Your order history will appear here.</p>
          <Button className="mt-6" onClick={() => navigate("/")}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="border rounded-lg p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <span className="font-medium">₹{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.products.image_url || "/placeholder.svg"}
                      alt={item.products.name}
                      className="w-12 h-12 rounded-md object-cover bg-secondary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} × ₹{item.price_at_purchase.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Orders;
