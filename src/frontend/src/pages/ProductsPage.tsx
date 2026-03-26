import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Apple, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

export default function ProductsPage() {
  const { actor } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!actor) return;
    actor
      .listProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actor]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  const categoryColors: Record<string, string> = {
    Citrus: "bg-orange-100 text-orange-700",
    Tropical: "bg-yellow-100 text-yellow-700",
    Pome: "bg-red-100 text-red-700",
    Berry: "bg-pink-100 text-pink-700",
    Melon: "bg-green-100 text-green-700",
  };

  return (
    <div data-ocid="products.page" className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Apple size={22} />
          Our Products
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse our fresh fruit selection
        </p>
      </div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="products.search_input"
          className="pl-9"
          placeholder="Search fruits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div
          data-ocid="products.loading_state"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <div key={k} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div
              data-ocid="products.empty_state"
              className="col-span-full text-center py-12 text-muted-foreground"
            >
              No products found
            </div>
          ) : (
            filtered.map((p, i) => (
              <Card
                key={p.id.toString()}
                data-ocid={`products.item.${i + 1}`}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Apple size={20} className="text-primary" />
                  </div>
                  <CardTitle className="text-base font-display">
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge
                    className={`text-xs ${categoryColors[p.category] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {p.category}
                  </Badge>
                  <p className="font-bold text-xl">
                    ₹{p.pricePerUnit.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{p.unit}
                    </span>
                  </p>
                  {Number(p.stockQuantity) > 0 ? (
                    <p className="text-xs text-green-600">
                      In stock ({p.stockQuantity.toString()} {p.unit})
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">Out of stock</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
