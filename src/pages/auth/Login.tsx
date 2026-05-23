import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/dashboard',
  ACADEMIC_DEPT: '/academic/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token, user } = await authService.login(email, password);

      // Save session
      login(token, user);

      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName}`);

      // Redirect to role-specific dashboard
      const targetRoute = ROLE_ROUTES[user.role] || '/';
      navigate(targetRoute, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu!';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Hệ thống chấm điểm báo cáo đề tài
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Tài khoản (Email hoặc MSSV)</Label>
              <Input 
                id="email" 
                type="text" 
                placeholder="admin@system.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground h-10 px-4 py-2 rounded-md hover:bg-primary/90 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
