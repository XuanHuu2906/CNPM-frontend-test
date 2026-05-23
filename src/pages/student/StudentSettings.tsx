import { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  Users,
  Save,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Mail,
  BookOpen,
  Loader2,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { studentService } from '../../services/studentService';
import { useProfile } from '../../hooks/useProfile';
import type { GroupDetail } from '../../types';

export default function StudentSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'group'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isPending: profileLoading } = useProfile();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!profile) return;

      if (profile.student?.groupId) {
        const groupRes = await studentService.getGroup(profile.student.groupId);
        setGroup(groupRes);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu cài đặt:', error);
      setError('Lỗi kết nối cơ sở dữ liệu để tải hồ sơ!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh đại diện không được vượt quá 5MB!');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ!');
      return;
    }

    try {
      setIsSavingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      await studentService.updateAvatar(formData);

      toast.success('Cập nhật ảnh đại diện thành công!');
      loadSettingsData();
    } catch (error: any) {
      console.error('Lỗi cập nhật ảnh đại diện:', error);
      toast.error(error.response?.data?.message || 'Cập nhật ảnh đại diện thất bại!');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ các trường mật khẩu!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải chứa ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await studentService.changePassword(currentPassword, newPassword);

      toast.success('Cập nhật mật khẩu mới thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Lỗi cập nhật mật khẩu:', error);
      const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại!';
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Đang tải cấu hình bảo mật tài khoản...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 p-8">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Có lỗi xảy ra</h3>
        <p className="text-sm font-medium text-slate-500 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  const studentCode = profile?.student?.studentCode || 'N/A';
  const classCode = profile?.student?.class?.classCode || 'N/A';
  const officialEmail = profile?.email || 'N/A';
  const advisorName = profile?.student?.class?.assignments?.[0]?.teacher?.user?.fullName || 'PGS.TS Nguyễn Văn A';

  const members = group?.members?.map((m: any) => {
    const s = m.student;
    const isMe = s?.id === profile?.student?.id;
    return {
      name: s?.user?.fullName || 'Thành viên lớp',
      mssv: s?.studentCode || 'N/A',
      role: isMe ? 'Thành viên (Bạn)' : 'Thành viên',
    };
  }) || [];

  const userName = profile?.fullName || '';
  const avatarUrl = profile?.avatar;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Cài đặt & Tài khoản
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Quản lý thông tin hồ sơ sinh viên, mật khẩu đăng nhập và thông tin nhóm học phần của bạn.
        </p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-all ${
            activeTab === 'profile'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          Thông tin cá nhân
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-in fade-in duration-300" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-all ${
            activeTab === 'password'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          Đổi mật khẩu
          {activeTab === 'password' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-in fade-in duration-300" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('group')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-all ${
            activeTab === 'group'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Thông tin nhóm & Đề tài
          {activeTab === 'group' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-in fade-in duration-300" />
          )}
        </button>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Hồ sơ cá nhân</CardTitle>
                  <CardDescription className="text-slate-400 font-medium text-xs mt-1">
                    Thông tin hồ sơ được đồng bộ từ hệ thống quản lý đào tạo. Chỉ có ảnh đại diện được thay đổi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Họ và Tên</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {userName}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mã số sinh viên (MSSV)</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          {studentCode}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lớp học phần</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          {classCode}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Khoa quản lý</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          Khoa Công nghệ thông tin
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email trường cấp</label>
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {officialEmail}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side Profile Overview card with avatar upload */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden text-center">
                <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <div className="px-6 pb-6 -mt-12">
                  <div className="relative w-24 h-24 mx-auto group">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-950 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center font-black text-3xl text-indigo-600 dark:text-indigo-400 overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        userName.split(' ').pop()?.substring(0, 2).toUpperCase() || 'SV'
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSavingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {isSavingAvatar && (
                    <p className="text-xs text-indigo-600 font-semibold mt-2">Đang cập nhật ảnh...</p>
                  )}

                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-4">{userName}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Sinh viên khoa CNTT</p>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3.5 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>MSSV:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{studentCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lớp học phần:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{classCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email trường:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-right">{officialEmail}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* PASSWORD TAB */}
        {activeTab === 'password' && (
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Đổi mật khẩu</CardTitle>
                <CardDescription className="text-slate-400 font-medium text-xs mt-1">
                  Đổi mật khẩu định kỳ giúp bảo vệ tài khoản và điểm số của bạn khỏi sự can thiệp trái phép.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="current-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="new-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mật khẩu mới</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu ít nhất 6 ký tự..."
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới..."
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                      <span className="font-extrabold block mb-0.5">Lời khuyên về bảo mật:</span>
                      Mật khẩu mạnh nên chứa chữ hoa, chữ thường, số và ít nhất một ký tự đặc biệt. Tránh sử dụng lại mật khẩu cũ hoặc thông tin dễ đoán.
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                    >
                      <KeyRound className="w-4 h-4" />
                      {isUpdatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GROUP & THESIS INFO TAB */}
        {activeTab === 'group' && (
          <div className="lg:col-span-12 space-y-8">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-2 text-left">
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                    Đồ án Môn học / Lớn
                  </span>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {group?.topicName || 'Chưa đăng ký đề tài nghiên cứu'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Giảng viên hướng dẫn: <span className="font-extrabold text-slate-600 dark:text-slate-300">{advisorName}</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">Danh sách thành viên nhóm</CardTitle>
                  <CardDescription className="text-slate-400 font-medium text-xs mt-1">
                    Nhóm học phần hiện có {members.length} thành viên thuộc lớp {classCode}.
                  </CardDescription>
                </div>
                <span className="text-xs font-bold py-1 px-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã chốt nhóm
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {members.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium">
                    Bạn chưa được gán vào nhóm học tập nào.
                  </div>
                ) : (
                  members.map((member: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border shadow-sm shrink-0">
                          {member.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'SV'}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{member.name}</p>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">MSSV: {member.mssv}</p>
                        </div>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          member.role.includes('(Bạn)')
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
