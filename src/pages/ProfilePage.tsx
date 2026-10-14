import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { User, BadgeCheck, MapPin, ShieldCheck, Mail, Phone, Save, KeyRound, CheckCircle2, Store } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { apiRequest } from '../lib/api';
import { DeliveryAddress } from '../types';

export default function ProfilePage() {
  const { user, profile, resetPassword, updateUserPassword, verifyEmail } = useAuth();
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [application, setApplication] = useState({
    storeName: '',
    description: '',
    contactPhone: '',
    businessAddress: '',
    city: '',
  });
  const [addressInput, setAddressInput] = useState({
    label: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    country: profile?.country || '',
    postalCode: profile?.postalCode || '',
    defaultAddress: profile?.defaultAddress || '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || '',
        postalCode: profile.postalCode || '',
        defaultAddress: profile.defaultAddress || '',
      });
    }
  }, [profile]);

  const accountStatus = useMemo(() => {
    if (!profile) return 'Unknown';
    if (profile.status === 'approved') return 'Active';
    if (profile.status === 'pending') return 'Pending review';
    if (profile.status === 'suspended') return 'Suspended';
    if (profile.status === 'restricted') return 'Restricted';
    return 'Rejected';
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim() || profile.displayName,
        phone: form.phone.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim(),
        defaultAddress: form.defaultAddress.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Profile updated');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error(error);
      toast.error('Could not send reset email');
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Use a password with at least 6 characters');
      return;
    }
    try {
      await updateUserPassword(newPassword);
      setNewPassword('');
      toast.success('Password updated');
    } catch (error) {
      console.error(error);
      toast.error('Could not update password');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail();
      toast.success('Verification email sent');
    } catch (error) {
      console.error(error);
      toast.error('Could not send verification email');
    }
  };

  const submitSellerApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApplicationSaving(true);
    try {
      await apiRequest('/api/seller/applications', {
        method: 'POST',
        body: JSON.stringify(application),
      });
      toast.success('Seller application submitted for review.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit seller application.');
    } finally {
      setApplicationSaving(false);
    }
  };

  const addAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile) return;
    if (!addressInput.label.trim() || !addressInput.address.trim() || !addressInput.city.trim()
      || !addressInput.postalCode.trim() || !addressInput.country.trim()) {
      toast.error('Complete the address name and delivery address fields.');
      return;
    }
    if ((profile.addresses || []).length >= 10) {
      toast.error('You can save up to 10 delivery addresses.');
      return;
    }
    const nextAddress = { ...addressInput, id: crypto.randomUUID() };
    try {
      const nextAddresses = [...(profile.addresses || []), nextAddress];
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: nextAddresses,
        defaultAddress: profile.defaultAddress || `${nextAddress.address}, ${nextAddress.city}, ${nextAddress.country}`,
        updatedAt: serverTimestamp(),
      });
      setAddressInput({ label: '', address: '', city: '', postalCode: '', country: '', phone: '' });
      toast.success('Delivery address saved.');
    } catch (error) {
      console.error('Address save failed:', error);
      toast.error('Could not save delivery address.');
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: (profile.addresses || []).filter(address => address.id !== addressId),
        updatedAt: serverTimestamp(),
      });
      toast.success('Address removed.');
    } catch (error) {
      console.error('Address deletion failed:', error);
      toast.error('Could not remove address.');
    }
  };

  const setDefaultAddress = async (address: DeliveryAddress) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        defaultAddress: `${address.address}, ${address.city}, ${address.country}`,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode,
        phone: address.phone || profile?.phone || '',
        updatedAt: serverTimestamp(),
      });
      toast.success('Default delivery address updated.');
    } catch (error) {
      console.error('Default address update failed:', error);
      toast.error('Could not update default address.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account, address, and security settings.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" /> {accountStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="h-16 w-16 rounded-full object-cover border" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{profile?.displayName?.[0] || 'U'}</div>
              )}
              <div>
                <div className="font-bold">{profile?.displayName || 'User'}</div>
                <div className="text-sm text-muted-foreground capitalize">{profile?.role || 'buyer'}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {user?.email}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {profile?.phone || 'No phone added'}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {profile?.city || 'No city set'}</div>
            </div>
            {!user?.emailVerified && (
              <Button variant="outline" className="w-full" onClick={handleVerifyEmail}>Verify email</Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Profile details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Full name" />
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" />
              <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country" />
              <Input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} placeholder="Postal code" />
              <Input value={form.defaultAddress} onChange={e => setForm({ ...form, defaultAddress: e.target.value })} placeholder="Default delivery address" className="md:col-span-2" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save profile'}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePasswordReset}>Send reset email</Button>
              <Button onClick={handleSetPassword}>Update password</Button>
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Saved delivery addresses</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(profile?.addresses || []).map(address => (
                  <div key={address.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3">
                    <div><strong>{address.label}</strong><p className="text-sm text-muted-foreground">{address.address}, {address.city}, {address.postalCode}, {address.country}</p></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void setDefaultAddress(address)}>Use for checkout</Button>
                      <Button size="sm" variant="ghost" onClick={() => void deleteAddress(address.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
                <form onSubmit={addAddress} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-dashed p-4">
                  <Input required maxLength={50} placeholder="Address name (Home, Work)" value={addressInput.label} onChange={event => setAddressInput({ ...addressInput, label: event.target.value })} />
                  <Input maxLength={40} placeholder="Phone (optional)" value={addressInput.phone} onChange={event => setAddressInput({ ...addressInput, phone: event.target.value })} />
                  <Input required maxLength={300} placeholder="Street address" value={addressInput.address} onChange={event => setAddressInput({ ...addressInput, address: event.target.value })} className="md:col-span-2" />
                  <Input required maxLength={100} placeholder="City" value={addressInput.city} onChange={event => setAddressInput({ ...addressInput, city: event.target.value })} />
                  <Input required maxLength={30} placeholder="Postal code" value={addressInput.postalCode} onChange={event => setAddressInput({ ...addressInput, postalCode: event.target.value })} />
                  <Input required maxLength={80} placeholder="Country" value={addressInput.country} onChange={event => setAddressInput({ ...addressInput, country: event.target.value })} />
                  <Button type="submit" className="md:col-span-2">Save address</Button>
                </form>
              </CardContent>
            </Card>

            {profile?.role !== 'seller' && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Apply to sell</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Applications are reviewed by an administrator. Seller permissions remain disabled while review is pending.</p>
                  {profile?.sellerApplication && <p className="text-sm font-semibold capitalize">Application: {profile.sellerApplication.status}{profile.sellerApplication.reason ? ` — ${profile.sellerApplication.reason}` : ''}</p>}
                  {profile?.sellerApplication?.status !== 'pending' && (
                    <form onSubmit={submitSellerApplication} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input required maxLength={100} placeholder="Store name" value={application.storeName} onChange={event => setApplication({ ...application, storeName: event.target.value })} />
                      <Input required maxLength={40} placeholder="Business contact phone" value={application.contactPhone} onChange={event => setApplication({ ...application, contactPhone: event.target.value })} />
                      <Input required maxLength={300} placeholder="Business address" value={application.businessAddress} onChange={event => setApplication({ ...application, businessAddress: event.target.value })} />
                      <Input required maxLength={100} placeholder="Business city" value={application.city} onChange={event => setApplication({ ...application, city: event.target.value })} />
                      <textarea required maxLength={2000} placeholder="Store and product description" value={application.description} onChange={event => setApplication({ ...application, description: event.target.value })} className="md:col-span-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" rows={3} />
                      <Button type="submit" disabled={applicationSaving} className="md:col-span-2">{applicationSaving ? 'Submitting…' : 'Submit application'}</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.location.assign('/orders')}>Order history</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Account status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold">Role:</span> {profile?.role || 'buyer'}</div>
            <div><span className="font-semibold">Status:</span> {accountStatus}</div>
            <div><span className="font-semibold">Email verified:</span> {user?.emailVerified ? 'Yes' : 'No'}</div>
            <div><span className="font-semibold">Seller application:</span> {profile?.sellerApplication?.status || 'Not started'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
