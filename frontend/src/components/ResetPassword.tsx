import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess, onSwitchToLogin }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/verify-reset-token/${token}`);

                if (!response.ok) {
                    setIsTokenValid(false);
                    setError('Link reset password tidak valid atau sudah kadaluarsa.');
                } else {
                    const data = await response.json();
                    setIsTokenValid(true);
                    setUserEmail(data.email || '');
                }
            } catch (err) {
                setIsTokenValid(false);
                setError('Gagal memverifikasi token. Silakan coba lagi.');
            } finally {
                setIsVerifying(false);
            }
        };

        if (token) {
            verifyToken();
        } else {
            setIsVerifying(false);
            setIsTokenValid(false);
            setError('Token tidak ditemukan.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    new_password: newPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Gagal mereset password');
            }

            setSuccess('Password berhasil direset! Anda akan dialihkan ke halaman login...');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Memverifikasi link reset password...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Invalid token state
    if (!isTokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-600">Link Tidak Valid</CardTitle>
                        <CardDescription>
                            {error || 'Link reset password tidak valid atau sudah kadaluarsa.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={onSwitchToLogin}
                            className="w-full"
                        >
                            Kembali ke Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        {userEmail ? `Masukkan password baru untuk ${userEmail}` : 'Masukkan password baru Anda'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Masukkan password baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isLoading || !!success}
                                    className="w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Konfirmasi password baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading || !!success}
                                    className="w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-800">{success}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !!success}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Mereset Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
                                className="text-sm text-primary hover:underline"
                            >
                                Kembali ke Login
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
