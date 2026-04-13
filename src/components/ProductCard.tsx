import React from 'react';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Product } from '../types';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white">
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.images[0] || `https://picsum.photos/seed/${product.name}/400/400`}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <Badge className="absolute top-2 left-2 bg-white/90 text-primary hover:bg-white">
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mt-1 h-10">
          {product.description}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.numReviews})</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold">${product.price}</span>
        <Button size="sm" onClick={() => onAddToCart?.(product)} className="gap-2">
          <ShoppingCart className="w-4 h-4" /> Add
        </Button>
      </CardFooter>
    </Card>
  );
}
