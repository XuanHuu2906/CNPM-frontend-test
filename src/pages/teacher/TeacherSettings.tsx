import { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Save, 
  Check, 
  Settings,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacherService';

export default function TeacherSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('Giảng viên');
  const [teacherCode, setTeacherCode] = useState('');

  const [notifyOnSubmit, setNotifyOnSubmit] = useState(true);
  const [notifyOnDiscussion, setNotifyOnDiscussion] = useState(true);

  // Load profile thông tin thật khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getTeacherProfile();
        setName(data.fullName);
        setEmail(data.email);
        setPhone(data.phoneNumber || '');
        setTeacherCode(data.teacher?.teacherCode || '');
        if (data.teacher?.title) {
          setTitle(data.teacher.title);
        }
      } catch (err) {
        toast.error("Không thể tải thông tin cá nhân giảng viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }

    try {
      setSaving(true);
      await teacherService.updateProfile({
        fullName: name,
        phoneNumber: phone,
      });
      toast.success('Cập nhật thông tin hồ sơ giảng viên thành công!');
    } catch (err) {
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = () => {
    toast.success('Đã lưu cấu hình nhận thông báo hệ thống!');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang tải thông tin hồ sơ của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Cài đặt tài khoản <span className="text-indigo-600 dark:text-indigo-400"><Settings className="w-8 h-8" /></span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Quản lý thông tin liên hệ, xem hồ sơ phân công học hàm và quản lý thông báo của Giảng viên.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Personal profile form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 text-left">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base font-bold">Hồ sơ Giảng viên cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã số giảng viên (MSGV)</label>
                    <input
                      type="text"
                      value={teacherCode}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 text-sm cursor-not-allowed font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email công vụ</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 text-sm cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại liên lạc</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Chưa cập nhật số điện thoại..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học hàm / Học vị</label>
                    <input
                      type="text"
                      value={title}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 text-sm cursor-not-allowed font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn vị công tác</label>
                    <input
                      type="text"
                      value="Trường Đại học Công nghệ Thông tin"
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 text-sm cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thông tin hồ sơ
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right side settings: Notifications preference */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 text-left">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base font-bold">Cấu hình thông báo</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Báo cáo mới nộp</p>
                  <p className="text-[11px] text-slate-400">Gửi Email khi có nhóm vừa nộp bản báo cáo mới.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyOnSubmit}
                  onChange={(e) => setNotifyOnSubmit(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tin nhắn thảo luận</p>
                  <p className="text-[11px] text-slate-400">Gửi Email khi có bình luận mới từ thành viên nhóm.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyOnDiscussion}
                  onChange={(e) => setNotifyOnDiscussion(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Cập nhật cấu hình
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
