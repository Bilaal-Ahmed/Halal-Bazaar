import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Trash2,
  ShieldCheck,
  Store,
  BarChart3,
} from 'lucide-react';
import { CATEGORIES } from '../types';
import type { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiRequest } from '../lib/api';
import { useNavigate } from 'react-router-dom';

type SellerOrder = Record<string, any> & { id: string };

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: string;
  category: string;
  isHalalCertified: boolean;
  imageURL: string;
};

const emptyProductForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  stock: '',
  category: 'food',
  isHalalCertified: true,
  imageURL: '',
};

const formatPKR = (amount: number): string =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const [store, setStore] = useState({
    storeName: '',
    description: '',
    contactPhone: '',
    businessAddress: '',
    city: '',
  });

  const [formData, setFormData] =
    useState<ProductFormData>(emptyProductForm);

  const isApprovedSeller =
    profile?.role === 'seller' && profile.status === 'approved';

  useEffect(() => {
    if (!profile) return;

    setStore({
      storeName: profile.storeName || '',
      description: profile.storeDescription || '',
      contactPhone: profile.sellerContactPhone || '',
      businessAddress: profile.businessAddress || '',
      city: profile.businessCity || '',
    });
  }, [profile]);

  // Load only this seller's listings.
  useEffect(() => {
    if (!user || !isApprovedSeller) {
      setMyProducts([]);
      return;
    }

    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        setMyProducts(
          snapshot.docs.map((document) => ({
            ...document.data(),
            id: document.id,
          }) as Product)
        );
      },
      (error) => {
        console.error('[SellerDashboard] Product loading failed:', error);
        toast.error('Could not load your product listings.');
      }
    );

    return unsubscribe;
  }, [user, isApprovedSeller]);

  const loadSellerOrders = async () => {
    setOrdersLoading(true);

    try {
      const result = await apiRequest<{ orders: SellerOrder[] }>(
        '/api/seller/orders'
      );

      setSellerOrders(result.orders || []);
    } catch (error) {
      console.error('Could not load seller orders:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not load seller orders.'
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isApprovedSeller) {
      void loadSellerOrders();
    } else {
      setSellerOrders([]);
    }
  }, [isApprovedSeller]);

  const resetProductForm = () => {
    setFormData({ ...emptyProductForm });
    setEditingProductId(null);
    setIsAdding(false);
  };

  const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !isApprovedSeller) {
      toast.error('An approved seller account is required.');
      return;
    }

    const name = formData.name.trim();
    const description = formData.description.trim();
    const priceText = formData.price.trim();
    const originalPriceText = formData.originalPrice.trim();
    const stockText = formData.stock.trim();
    const imageURL = formData.imageURL.trim();

    if (!name || name.length > 120) {
      toast.error('Enter a product name between 1 and 120 characters.');
      return;
    }

    if (!description || description.length > 5000) {
      toast.error('Enter a product description of up to 5,000 characters.');
      return;
    }

    if (!priceText) {
      toast.error('Enter the selling price in PKR.');
      return;
    }

    const price = Number(priceText);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Selling price must be a number greater than zero.');
      return;
    }

    if (!stockText) {
      toast.error('Enter the available stock quantity.');
      return;
    }

    const stock = Number(stockText);

    if (!Number.isSafeInteger(stock) || stock < 0) {
      toast.error('Stock must be a whole number of zero or more.');
      return;
    }

    let originalPrice: number | null = null;

    if (originalPriceText !== '') {
      originalPrice = Number(originalPriceText);

      if (!Number.isFinite(originalPrice) || originalPrice <= price) {
        toast.error(
          'Original price must be greater than the selling price. Leave it blank if there is no discount.'
        );
        return;
      }
    }

    if (!CATEGORIES.some((item) => item.slug === formData.category)) {
      toast.error('Please select a valid product category.');
      return;
    }

    if (imageURL) {
      try {
        const parsedURL = new URL(imageURL);

        if (
          parsedURL.protocol !== 'https:' ||
          imageURL.length > 2048
        ) {
          toast.error('Use a valid HTTPS product image URL.');
          return;
        }
      } catch {
        toast.error('Enter a valid HTTPS product image URL.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const productData = {
        name,
        description,
        price,
        originalPrice,
        stock,
        category: formData.category,
        isHalalCertified: formData.isHalalCertified,
        images: imageURL ? [imageURL] : [],
      };

      if (editingProductId) {
        // Only edit a product owned by the current seller.
        const existingProduct = myProducts.find(
          (product) => product.id === editingProductId
        );

        if (!existingProduct || existingProduct.sellerId !== user.uid) {
          toast.error('You cannot edit this product.');
          return;
        }

        await updateDoc(doc(db, 'products', editingProductId), productData);
        toast.success('Product updated successfully.');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          sellerId: user.uid,
          sellerName:
            profile?.storeName || profile?.displayName || '',
          rating: 0,
          numReviews: 0,
          published: true,
          createdAt: serverTimestamp(),
        });

        toast.success('Product published successfully.');
      }

      resetProductForm();
    } catch (error) {
      console.error('[SellerDashboard] Product save failed:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save this product listing.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingProduct = (product: Product) => {
    if (!user || product.sellerId !== user.uid) {
      toast.error('You cannot edit this product.');
      return;
    }

    setEditingProductId(product.id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      originalPrice:
        product.originalPrice != null
          ? String(product.originalPrice)
          : '',
      stock: product.stock != null ? String(product.stock) : '',
      category: product.category || 'food',
      isHalalCertified: Boolean(product.isHalalCertified),
      imageURL: product.images?.[0] || '',
    });

    setIsAdding(true);
  };

  const handleDelete = async (product: Product) => {
    if (!user || product.sellerId !== user.uid) {
      toast.error('You cannot delete this product.');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product.name}" ? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'products', product.id));
      toast.success('Product removed.');
    } catch (error) {
      console.error('[SellerDashboard] Product deletion failed:', error);
      toast.error('Could not remove this product.');
    }
  };

  const saveInventory = async (product: Product, input: string) => {
    if (!user || product.sellerId !== user.uid) {
      toast.error('You cannot update this inventory.');
      return;
    }

    if (input.trim() === '') {
      toast.error('Enter a stock quantity.');
      return;
    }

    const stock = Number(input);

    if (!Number.isSafeInteger(stock) || stock < 0) {
      toast.error('Stock must be a whole number of zero or more.');
      return;
    }

    if (stock === product.stock) return;

    try {
      await updateDoc(doc(db, 'products', product.id), { stock });
      toast.success('Inventory updated.');
    } catch (error) {
      console.error('[SellerDashboard] Inventory update failed:', error);
      toast.error('Could not update inventory.');
    }
  };

  const setProductPublished = async (product: Product) => {
    if (!user || product.sellerId !== user.uid) {
      toast.error('You cannot change this listing.');
      return;
    }

    try {
      const published = product.published !== true;

      await updateDoc(doc(db, 'products', product.id), { published });

      toast.success(
        published ? 'Listing published.' : 'Listing hidden.'
      );
    } catch (error) {
      console.error('[SellerDashboard] Publishing update failed:', error);
      toast.error('Could not update listing visibility.');
    }
  };

  const saveStoreProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!store.storeName.trim() || !store.description.trim()) {
      toast.error('Enter your store name and description.');
      return;
    }

    setStoreSaving(true);

    try {
      await apiRequest('/api/seller/store', {
        method: 'PUT',
        body: JSON.stringify({
          ...store,
          storeName: store.storeName.trim(),
          description: store.description.trim(),
          contactPhone: store.contactPhone.trim(),
          businessAddress: store.businessAddress.trim(),
          city: store.city.trim(),
        }),
      });

      toast.success('Store profile saved.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save store profile.'
      );
    } finally {
      setStoreSaving(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      await apiRequest(
        `/ api / seller / orders / ${ encodeURIComponent(orderId) }/fulfillment`,
{
  method: 'PATCH',
    body: JSON.stringify({ status }),
        }
      );

toast.success('Order fulfillment updated.');
await loadSellerOrders();
    } catch (error) {
  toast.error(
    error instanceof Error
      ? error.message
      : 'Could not update fulfillment.'
  );
}
  };

if (!isApprovedSeller) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Store className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-2 text-2xl font-black">
        Approved Seller Access Required
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Seller tools are available only after an administrator approves
        your seller application.
      </p>
      <Button className="mt-4" onClick={() => navigate('/profile')}>
        Open profile and apply
      </Button>
    </div>
  );
}

const grossOrderValue = sellerOrders.reduce(
  (sum, order) =>
    sum +
    (order.items || []).reduce(
      (lineSum: number, line: any) =>
        line.product?.sellerId === user?.uid
          ? lineSum +
          Number(
            line.lineTotal ??
            Number(line.product?.price || 0) *
            Number(line.quantity || 0)
          )
          : lineSum,
      0
    ),
  0
);

const awaitingFulfillment = sellerOrders.filter(
  (order) => order.fulfillmentStatus !== 'delivered'
).length;

return (
  <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-3xl font-black">Seller Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back,{' '}
          <span className="font-semibold text-foreground">
            {profile?.displayName || 'Seller'}
          </span>
        </p>
      </div>

      <Button
        id="add-product-btn"
        onClick={() =>
          isAdding ? resetProductForm() : setIsAdding(true)
        }
        className={`gap-2 font-bold btn-primary-glow ${isAdding ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
      >
        <Plus className="h-4 w-4" />
        {isAdding ? 'Cancel' : 'Add New Product'}
      </Button>
    </div>

    {/* Statistics */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {[
        {
          title: 'My Products',
          value: myProducts.length,
          icon: <Package className="h-5 w-5" />,
          color: 'bg-blue-50 text-blue-600',
        },
        {
          title: 'Gross order value',
          value: formatPKR(grossOrderValue),
          icon: <DollarSign className="h-5 w-5" />,
          color: 'bg-green-50 text-green-600',
        },
        {
          title: 'Awaiting fulfillment',
          value: awaitingFulfillment,
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'bg-purple-50 text-purple-600',
        },
      ].map((stat) => (
        <Card key={stat.title} className="border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-xl p-2 ${stat.color}`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Store profile */}
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Store profile
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={saveStoreProfile}
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <Input
            aria-label="Store name"
            required
            maxLength={100}
            placeholder="Store name"
            value={store.storeName}
            onChange={(event) =>
              setStore({ ...store, storeName: event.target.value })
            }
          />

          <Input
            aria-label="Contact phone"
            maxLength={40}
            placeholder="Contact phone"
            value={store.contactPhone}
            onChange={(event) =>
              setStore({ ...store, contactPhone: event.target.value })
            }
          />

          <Input
            aria-label="Business address"
            maxLength={300}
            placeholder="Business address"
            value={store.businessAddress}
            onChange={(event) =>
              setStore({
                ...store,
                businessAddress: event.target.value,
              })
            }
          />

          <Input
            aria-label="Business city"
            maxLength={100}
            placeholder="Business city"
            value={store.city}
            onChange={(event) =>
              setStore({ ...store, city: event.target.value })
            }
          />

          <textarea
            aria-label="Store description"
            maxLength={2000}
            required
            placeholder="Store description"
            value={store.description}
            onChange={(event) =>
              setStore({ ...store, description: event.target.value })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm md:col-span-2"
            rows={3}
          />

          <Button
            type="submit"
            disabled={storeSaving}
            className="md:col-span-2"
          >
            {storeSaving ? 'Saving...' : 'Save store profile'}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Product form */}
    <AnimatePresence>
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
        >
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {editingProductId
                  ? 'Edit Product Listing'
                  : 'New Product Listing'}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form
                id="add-product-form"
                onSubmit={handleAddProduct}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <Input
                  id="product-name-input"
                  aria-label="Product name"
                  placeholder="Product Name *"
                  maxLength={120}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value,
                    })
                  }
                  className="sm:col-span-2"
                  required
                />

                <textarea
                  aria-label="Product description"
                  placeholder="Product Description *"
                  required
                  maxLength={5000}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="flex w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
                />

                {/* Category */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Category
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => (
                      <button
                        type="button"
                        key={item.slug}
                        aria-pressed={formData.category === item.slug}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            category: item.slug,
                          })
                        }
                        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${formData.category === item.slug
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'
                          }`}
                      >
                        {item.icon} {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  id="product-price-input"
                  aria-label="Selling price in Pakistani rupees"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Selling Price (PKR) *"
                  value={formData.price}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      price: event.target.value,
                    })
                  }
                  required
                />

                <Input
                  id="product-original-price-input"
                  aria-label="Original price in Pakistani rupees"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Original Price (PKR, optional)"
                  value={formData.originalPrice}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      originalPrice: event.target.value,
                    })
                  }
                />

                <Input
                  id="product-stock-input"
                  aria-label="Stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock Quantity *"
                  value={formData.stock}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      stock: event.target.value,
                    })
                  }
                  required
                />

                <Input
                  id="product-image-url-input"
                  aria-label="Product image HTTPS URL"
                  type="url"
                  placeholder="Product image HTTPS URL (optional)"
                  value={formData.imageURL}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      imageURL: event.target.value,
                    })
                  }
                  className="sm:col-span-2"
                />

                {/* Halal certification */}
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="halal-certified-check"
                    checked={formData.isHalalCertified}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        isHalalCertified: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-primary"
                  />

                  <label
                    htmlFor="halal-certified-check"
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    This product is Halal Certified
                  </label>
                </div>

                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Prices are entered in Pakistani rupees (PKR). Leave
                  Original Price blank if you are not offering a discount.
                  Only mark a product Halal Certified if you can support
                  that claim.
                </p>

                <Button
                  id="submit-product-btn"
                  type="submit"
                  className="h-11 font-bold btn-primary-glow sm:col-span-2"
                  disabled={submitting}
                >
                  {submitting
                    ? editingProductId
                      ? 'Saving...'
                      : 'Publishing...'
                    : editingProductId
                      ? 'Save Changes'
                      : 'Publish Listing'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Product listings */}
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          My Listings
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {myProducts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold">No products listed yet</p>
            <p className="mt-1 text-sm">
              Click "Add New Product" to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {myProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {product.name}
                    </td>

                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {product.category}
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {formatPKR(Number(product.price) || 0)}
                    </td>

                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.stock ?? ''}
                        aria-label={`Stock for ${product.name}`}
                        className="w-24"
                        onBlur={(event) => {
                          const input = event.currentTarget.value;
                          if (input.trim() !== '') {
                            void saveInventory(product, input);
                          }
                        }}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {product.isHalalCertified && (
                          <Badge variant="secondary">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Halal Certified
                          </Badge>
                        )}

                        <Badge
                          variant={
                            product.published === true
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {product.published === true
                            ? 'Published'
                            : 'Unpublished'}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingProduct(product)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void setProductPublished(product)}
                        >
                          {product.published === true
                            ? 'Unpublish'
                            : 'Publish'}
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => void handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Seller orders */}
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Seller orders
        </CardTitle>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadSellerOrders()}
          disabled={ordersLoading}
        >
          {ordersLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {ordersLoading && (
          <p className="py-6 text-center text-muted-foreground">
            Loading orders...
          </p>
        )}

        {!ordersLoading && sellerOrders.length === 0 && (
          <p className="py-6 text-center text-muted-foreground">
            No orders for your store yet.
          </p>
        )}

        {sellerOrders.map((order) => {
          const fulfillment = order.fulfillmentStatus || 'pending';

          const nextStatus: Record<string, string> = {
            pending: 'processing',
            processing: 'shipped',
            shipped: 'delivered',
          };

          const lines = (order.items || []).filter(
            (line: any) => line.product?.sellerId === user?.uid
          );

          return (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-bold">Order {order.id}</p>

                <p className="text-sm text-muted-foreground">
                  {lines
                    .map(
                      (line: any) =>
                        `${line.product?.name || 'Product'} × ${line.quantity}`
                    )
                    .join(', ')}
                </p>

                <p className="text-sm capitalize">
                  Your fulfillment: {fulfillment} · Payment:{' '}
                  {order.paymentStatus || 'unknown'}
                </p>

                <p className="text-xs text-muted-foreground">
                  {order.shippingAddress?.name}
                  {order.shippingAddress?.address
                    ? ` · ${order.shippingAddress.address}`
                    : ''}
                  {order.shippingAddress?.city
                    ? `, ${order.shippingAddress.city}`
                    : ''}
                  {order.shippingAddress?.country
                    ? `, ${order.shippingAddress.country}`
                    : ''}
                </p>
              </div>

              {nextStatus[fulfillment] && (
                <Button
                  size="sm"
                  onClick={() =>
                    void updateOrderStatus(
                      order.id,
                      nextStatus[fulfillment]
                    )
                  }
                >
                  Mark {nextStatus[fulfillment]}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  </div>
);
}