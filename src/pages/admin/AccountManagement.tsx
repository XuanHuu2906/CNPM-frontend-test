import { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  UserPlus,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  Copy,
  Plus,
  ShieldAlert,
  MoreVertical,
  Eye,
  UserMinus,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';

interface Account {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'ACADEMIC_DEPT' | 'ADMIN';
  identifier: string; // MSSV, Mã GV, Mã NV
  phone: string;
  createdAt: string;
  isActive: boolean;
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Checkbox multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);

  // Active action menu row ID state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Dialog view details state
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);

  // Dialog confirmation states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'LOCK' | 'UNLOCK' | 'DEACTIVATE' | 'ACTIVATE' | 'RESET' | 'LOCK_BULK' | 'UNLOCK_BULK' | 'RESET_BULK' | 'DEACTIVATE_BULK' | 'ACTIVATE_BULK';
    accountId?: string;
    accountName?: string;
  } | null>(null);

  // Modal Create Account States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'STUDENT' | 'TEACHER' | 'ACADEMIC_DEPT' | 'ADMIN'>('STUDENT');
  const [newIdentifier, setNewIdentifier] = useState('');

  // Modal Reset Password States
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('123456');
  const [copied, setCopied] = useState(false);

  // Tải dữ liệu người dùng từ API và đồng bộ
  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAllUsers();
      const deactivatedIds: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');

      const mapped: Account[] = data.map((u: any) => {
        // Bóc tách mã số định danh dựa theo vai trò thực tế
        let identifier = 'Hệ thống';
        if (u.role === 'STUDENT' && u.student) {
          identifier = u.student.studentCode;
        } else if (u.role === 'TEACHER' && u.teacher) {
          identifier = u.teacher.teacherCode;
        } else if (u.role === 'ACADEMIC_DEPT' && u.academicDept) {
          identifier = u.academicDept.employeeCode;
        } else if (u.role === 'ADMIN' && u.admin) {
          identifier = u.admin.employeeCode;
        }

        return {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          identifier: identifier || 'Chưa thiết lập',
          phone: u.phoneNumber || 'Chưa cung cấp',
          createdAt: new Date(u.createdAt).toISOString().split('T')[0],
          isActive: u.isActive !== false
        };
      });

      setAccounts(mapped);
    } catch (error: any) {
      toast.error(`Không thể tải danh sách tài khoản: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    // Close active menu when clicking outside
    const handleOutsideClick = () => {
      setActiveMenuId(null);
      setIsBulkMenuOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Thống kê chính xác theo Enum vai trò mới
  const totalCount = accounts.length;
  const activeCount = accounts.filter(a => a.isActive).length;
  const deactivatedIdsLocal: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');
  const lockedCount = accounts.filter(a => !a.isActive && !deactivatedIdsLocal.includes(a.id)).length;
  const disabledCount = accounts.filter(a => !a.isActive && deactivatedIdsLocal.includes(a.id)).length;

  const studentCount = accounts.filter(a => a.role === 'STUDENT').length;
  const teacherCount = accounts.filter(a => a.role === 'TEACHER').length;

  // Tính toán trạng thái của các tài khoản đang được chọn
  const selectedAccounts = accounts.filter(a => selectedIds.includes(a.id));
  const selActiveCount = selectedAccounts.filter(a => a.isActive).length;
  const selDeactivatedCount = selectedAccounts.filter(a => !a.isActive && deactivatedIdsLocal.includes(a.id)).length;
  const selLockedCount = selectedAccounts.filter(a => !a.isActive && !deactivatedIdsLocal.includes(a.id)).length;

  const hasActive = selActiveCount > 0;
  const hasLocked = selLockedCount > 0;
  const hasDeactivated = selDeactivatedCount > 0;

  const showDeactivateOption = hasActive || hasLocked;
  const showUnlockOption = hasActive && hasLocked;
  const showActivateOption = hasDeactivated && (hasActive || hasLocked);
  const showDropdown = showDeactivateOption || showUnlockOption || showActivateOption;

  // Lọc danh sách
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.fullName.toLowerCase().includes(search.toLowerCase()) ||
      account.email.toLowerCase().includes(search.toLowerCase()) ||
      account.identifier.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || account.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = account.isActive;
    } else if (statusFilter === 'LOCKED') {
      matchesStatus = !account.isActive && !deactivatedIdsLocal.includes(account.id);
    } else if (statusFilter === 'DISABLED') {
      matchesStatus = !account.isActive && deactivatedIdsLocal.includes(account.id);
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  // Sync header checkbox indeterminate state
  useEffect(() => {
    if (headerCheckboxRef.current) {
      const pageIds = paginatedAccounts.map(a => a.id);
      const selectedPageIds = pageIds.filter(id => selectedIds.includes(id));
      const isAllPageSelected = pageIds.length > 0 && selectedPageIds.length === pageIds.length;
      headerCheckboxRef.current.indeterminate = selectedPageIds.length > 0 && !isAllPageSelected;
    }
  }, [selectedIds, paginatedAccounts]);

  // Thực thi thay đổi trạng thái hoạt động (Lock / Unlock / Deactivate / Activate)
  const handleExecuteStatusChange = async () => {
    if (!confirmAction) return;
    const { type, accountId, accountName } = confirmAction;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    try {
      toast.loading('Đang xử lý yêu cầu cập nhật tài khoản...', { id: 'status-update' });

      let nextStatus = account.isActive;
      let deactivatedList: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');

      if (type === 'LOCK') {
        nextStatus = false;
        // Loại bỏ khỏi danh sách vô hiệu hóa nếu lỡ có
        deactivatedList = deactivatedList.filter(id => id !== accountId);
      } else if (type === 'UNLOCK') {
        nextStatus = true;
        deactivatedList = deactivatedList.filter(id => id !== accountId);
      } else if (type === 'DEACTIVATE') {
        nextStatus = false;
        if (!deactivatedList.includes(accountId)) {
          deactivatedList.push(accountId);
        }
      } else if (type === 'ACTIVATE') {
        nextStatus = true;
        deactivatedList = deactivatedList.filter(id => id !== accountId);
      }

      localStorage.setItem('deactivated-user-ids', JSON.stringify(deactivatedList));

      // Gọi API cập nhật
      await adminService.updateUserRoleStatus(accountId, account.role, nextStatus);

      setAccounts(prev => prev.map(a => {
        if (a.id === accountId) {
          return { ...a, isActive: nextStatus };
        }
        return a;
      }));

      // Thông báo thành công tương ứng
      if (type === 'LOCK') toast.warning(`Đã khóa tài khoản của ${accountName} thành công!`, { id: 'status-update' });
      if (type === 'UNLOCK') toast.success(`Đã mở khóa tài khoản của ${accountName} thành công!`, { id: 'status-update' });
      if (type === 'DEACTIVATE') toast.error(`Đã vô hiệu hóa tài khoản của ${accountName} thành công!`, { id: 'status-update' });
      if (type === 'ACTIVATE') toast.success(`Đã tái kích hoạt tài khoản của ${accountName} thành công!`, { id: 'status-update' });

      setConfirmAction(null);
    } catch (error: any) {
      toast.error(`Thao tác thất bại: ${error.message}`, { id: 'status-update' });
    }
  };

  // Thực thi thay đổi trạng thái hoạt động hàng loạt (Bulk Lock / Unlock / Deactivate / Activate / Reset Password)
  const handleExecuteBulkAction = async () => {
    if (!confirmAction) return;
    const { type } = confirmAction;

    // Phân loại tài khoản được chọn để tìm các tài khoản hợp lệ
    let eligibleIds: string[] = [];
    let skippedCount = 0;

    const deactivatedListLocal: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');

    selectedIds.forEach(id => {
      const account = accounts.find(a => a.id === id);
      if (!account) return;

      const isActive = account.isActive;
      const isDeac = deactivatedListLocal.includes(id);
      const isLock = !isActive && !isDeac;

      if (type === 'LOCK_BULK') {
        if (isActive) eligibleIds.push(id);
        else skippedCount++;
      } else if (type === 'UNLOCK_BULK') {
        if (isLock) eligibleIds.push(id);
        else skippedCount++;
      } else if (type === 'RESET_BULK') {
        eligibleIds.push(id); // Tất cả tài khoản được chọn đều hợp lệ để reset mật khẩu
      } else if (type === 'DEACTIVATE_BULK') {
        if (isActive || isLock) eligibleIds.push(id);
        else skippedCount++;
      } else if (type === 'ACTIVATE_BULK') {
        if (isDeac) eligibleIds.push(id);
        else skippedCount++;
      }
    });

    if (eligibleIds.length === 0) {
      toast.error("Không có tài khoản nào hợp lệ trong số các tài khoản được chọn để thực thi thao tác này!");
      setConfirmAction(null);
      return;
    }

    try {
      toast.loading(`Đang xử lý thao tác hàng loạt cho ${eligibleIds.length} tài khoản...`, { id: 'bulk-update' });

      let deactivatedList: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');

      const promises = eligibleIds.map(async (id) => {
        const account = accounts.find(a => a.id === id);
        if (!account) return;

        let nextStatus = account.isActive;
        if (type === 'LOCK_BULK') {
          nextStatus = false;
          deactivatedList = deactivatedList.filter(dId => dId !== id);
        } else if (type === 'UNLOCK_BULK') {
          nextStatus = true;
          deactivatedList = deactivatedList.filter(dId => dId !== id);
        } else if (type === 'RESET_BULK') {
          await adminService.resetUserPassword(id, '123456');
          return;
        } else if (type === 'DEACTIVATE_BULK') {
          nextStatus = false;
          if (!deactivatedList.includes(id)) {
            deactivatedList.push(id);
          }
        } else if (type === 'ACTIVATE_BULK') {
          nextStatus = true;
          deactivatedList = deactivatedList.filter(dId => dId !== id);
        }

        // Gọi API cập nhật trạng thái
        await adminService.updateUserRoleStatus(id, account.role, nextStatus);
      });

      const results = await Promise.allSettled(promises);
      const successfulCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      localStorage.setItem('deactivated-user-ids', JSON.stringify(deactivatedList));

      // Cập nhật lại state accounts tại giao diện
      setAccounts(prev => prev.map(a => {
        if (eligibleIds.includes(a.id)) {
          let nextActive = a.isActive;
          if (type === 'LOCK_BULK' || type === 'DEACTIVATE_BULK') {
            nextActive = false;
          } else if (type === 'UNLOCK_BULK' || type === 'ACTIVATE_BULK') {
            nextActive = true;
          }
          return { ...a, isActive: nextActive };
        }
        return a;
      }));

      // Báo cáo kết quả
      let msg = `Thành công: ${successfulCount}`;
      if (failedCount > 0) msg += `, Thất bại: ${failedCount}`;
      if (skippedCount > 0) msg += `, Bỏ qua: ${skippedCount}`;

      if (failedCount === 0) {
        toast.success(`Hoàn tất thao tác hàng loạt! ${msg}`, { id: 'bulk-update' });
      } else {
        toast.warning(`Hoàn tất thao tác (có một số lỗi): ${msg}`, { id: 'bulk-update' });
      }

      setSelectedIds([]);
      setConfirmAction(null);
    } catch (error: any) {
      toast.error(`Thao tác hàng loạt thất bại: ${error.message}`, { id: 'bulk-update' });
    }
  };

  // Tạo tài khoản thủ công qua API
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newIdentifier) {
      toast.error('Vui lòng nhập đầy đủ các trường thông tin bắt buộc!');
      return;
    }

    const emailExists = accounts.some(a => a.email.toLowerCase() === newEmail.toLowerCase());
    if (emailExists) {
      toast.error('Email này đã tồn tại trong hệ thống!');
      return;
    }

    const identifierExists = accounts.some(a => a.identifier.toLowerCase() === newIdentifier.toLowerCase());
    if (identifierExists) {
      toast.error('Mã định danh này đã tồn tại trong hệ thống!');
      return;
    }

    try {
      toast.loading('Đang khởi tạo tài khoản...', { id: 'create-account' });
      const payload = {
        email: newEmail,
        fullName: newFullName,
        role: newRole,
        employeeCodeOrMssv: newIdentifier,
        phoneNumber: newPhone || undefined,
        password: '123456' // Mật khẩu mặc định hệ thống
      };

      await adminService.createUser(payload);

      toast.success(`Đã tạo thành công tài khoản cho ${newFullName}!`, { id: 'create-account' });

      // Tải lại danh sách
      loadAccounts();

      // Reset Form & Close Modal
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewRole('STUDENT');
      setNewIdentifier('');
      setIsCreateOpen(false);
    } catch (error: any) {
      toast.error(`Khởi tạo tài khoản thất bại: ${error.message}`, { id: 'create-account' });
    }
  };

  // Mở modal đặt lại mật khẩu và khởi tạo ngẫu nhiên
  const handleOpenReset = (account: Account) => {
    setSelectedAccount(account);
    const generatedPwd = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPasswordValue(generatedPwd);
    setCopied(false);
    setIsResetOpen(true);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPasswordValue);
    setCopied(true);
    toast.success('Đã copy mật khẩu vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Xác nhận đặt lại mật khẩu mới qua API
  const confirmReset = async () => {
    if (!selectedAccount) return;

    try {
      toast.loading('Đang cập nhật mật khẩu mới...', { id: 'reset-pwd' });
      await adminService.resetUserPassword(selectedAccount.id, newPasswordValue);

      toast.success(`Đã cấp lại mật khẩu mới cho ${selectedAccount.fullName} thành công!`, { id: 'reset-pwd' });
      setIsResetOpen(false);
      setSelectedAccount(null);
    } catch (error: any) {
      toast.error(`Đặt lại mật khẩu thất bại: ${error.message}`, { id: 'reset-pwd' });
    }
  };

  // Trình bày Việt hóa các vai trò
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'STUDENT': return 'Sinh viên';
      case 'TEACHER': return 'Giảng viên';
      case 'ACADEMIC_DEPT': return 'Phòng Đào tạo';
      default: return role;
    }
  };

  // Tính toán số lượng hợp lệ và bỏ qua cho hộp thoại xác nhận
  const getBulkActionCounts = (type: string) => {
    let eligible = 0;
    let skipped = 0;
    let skipReason = '';
    const deactivatedListLocal: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');

    selectedIds.forEach(id => {
      const account = accounts.find(a => a.id === id);
      if (!account) return;

      const isActive = account.isActive;
      const isDeac = deactivatedListLocal.includes(id);
      const isLock = !isActive && !isDeac;

      if (type === 'LOCK_BULK') {
        if (isActive) eligible++;
        else {
          skipped++;
          skipReason = 'tài khoản đã bị khóa hoặc vô hiệu hóa';
        }
      } else if (type === 'UNLOCK_BULK') {
        if (isLock) eligible++;
        else {
          skipped++;
          skipReason = 'tài khoản đang hoạt động hoặc đã vô hiệu hóa';
        }
      } else if (type === 'RESET_BULK') {
        eligible++;
      } else if (type === 'DEACTIVATE_BULK') {
        if (isActive || isLock) eligible++;
        else {
          skipped++;
          skipReason = 'tài khoản đã ở trạng thái vô hiệu hóa';
        }
      } else if (type === 'ACTIVATE_BULK') {
        if (isDeac) eligible++;
        else {
          skipped++;
          skipReason = 'tài khoản chưa bị vô hiệu hóa';
        }
      }
    });

    return { eligible, skipped, skipReason };
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200';
      case 'ACADEMIC_DEPT': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200';
      case 'TEACHER': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  // Lấy trạng thái tài khoản chi tiết
  const isDeactivated = (accountId: string) => {
    const deactivatedList: string[] = JSON.parse(localStorage.getItem('deactivated-user-ids') || '[]');
    return deactivatedList.includes(accountId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Quản lý tài khoản toàn hệ thống
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-5 py-6 shadow-lg shadow-violet-500/25 flex items-center gap-2 self-start md:self-auto transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Thêm tài khoản mới
        </Button>
      </div>

      {/* DASHBOARD STATUS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl hover:shadow-md transition-all">
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng tài khoản</p>
              <h3 className="text-3xl font-black">{totalCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl hover:shadow-md transition-all">
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đang hoạt động</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl hover:shadow-md transition-all">
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bị khóa / Vô hiệu hóa</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-455">
                {lockedCount} <span className="text-sm font-semibold text-slate-400">khóa</span> / {disabledCount} <span className="text-sm font-semibold text-slate-400">vô hiệu</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <UserX className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl hover:shadow-md transition-all">
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SV / Giảng viên</p>
              <h3 className="text-2xl font-black">{studentCount} / {teacherCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl">
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* SEARCH INPUT */}
          <div className="relative w-full md:flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm theo họ tên, email, mã số định danh..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
            />
          </div>

          {/* DROPDOWN FILTERS */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/20">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="STUDENT">Sinh viên</option>
                <option value="TEACHER">Giảng viên</option>
                <option value="ACADEMIC_DEPT">Phòng Đào tạo</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/20">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="LOCKED">Bị khóa tạm thời</option>
                <option value="DISABLED">Đã vô hiệu hóa</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/65 flex items-center justify-center text-violet-600 dark:text-violet-400 font-extrabold text-sm border border-violet-200 dark:border-violet-900 animate-pulse">
              {selectedIds.length}
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              tài khoản đang được chọn
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Bỏ chọn
            </Button>

            <Button
              size="sm"
              onClick={() => setConfirmAction({ type: 'RESET_BULK' })}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm h-9 px-4"
            >
              Đặt lại mật khẩu
            </Button>

            {hasActive && (
              <Button
                size="sm"
                onClick={() => setConfirmAction({ type: 'LOCK_BULK' })}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm h-9 px-4"
              >
                Khóa tài khoản
              </Button>
            )}

            {!hasActive && hasLocked && (
              <Button
                size="sm"
                onClick={() => setConfirmAction({ type: 'UNLOCK_BULK' })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm h-9 px-4"
              >
                Mở khóa hàng loạt
              </Button>
            )}

            {!hasActive && !hasLocked && hasDeactivated && (
              <Button
                size="sm"
                onClick={() => setConfirmAction({ type: 'ACTIVATE_BULK' })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm h-9 px-4"
              >
                Kích hoạt lại hàng loạt
              </Button>
            )}

            {/* Dropdown "Thêm thao tác" */}
            {showDropdown && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBulkMenuOpen(!isBulkMenuOpen);
                  }}
                  className="rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 h-9 px-4"
                >
                  Thêm thao tác
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200" style={{ transform: isBulkMenuOpen ? 'rotate(180deg)' : 'none' }} />
                </Button>

                {isBulkMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      {showUnlockOption && (
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'UNLOCK_BULK' });
                            setIsBulkMenuOpen(false);
                          }}
                          className="w-full px-4.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Mở khóa hàng loạt
                        </button>
                      )}

                      {showDeactivateOption && (
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'DEACTIVATE_BULK' });
                            setIsBulkMenuOpen(false);
                          }}
                          className="w-full px-4.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Vô hiệu hóa tài khoản đã chọn
                        </button>
                      )}

                      {showActivateOption && (
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'ACTIVATE_BULK' });
                            setIsBulkMenuOpen(false);
                          }}
                          className="w-full px-4.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors text-left"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Kích hoạt lại hàng loạt
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNTS DATA TABLE */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-lg rounded-2xl overflow-visible">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-500 mt-4">Đang tải danh sách người dùng...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">

                  {/* Select Checkbox Column Header */}
                  <th className="py-4.5 px-4 text-center w-12 shrink-0">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={paginatedAccounts.length > 0 && paginatedAccounts.every(a => selectedIds.includes(a.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginatedAccounts.map(a => a.id);
                          setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
                        } else {
                          const pageIds = paginatedAccounts.map(a => a.id);
                          setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 accent-violet-600 cursor-pointer"
                    />
                  </th>

                  <th className="py-4.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mã định danh</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Người dùng</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Ngày tạo</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedAccounts.length > 0 ? (
                  paginatedAccounts.map((account) => {
                    const isAccountDisabled = isDeactivated(account.id);
                    return (
                      <tr key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-all">

                        {/* Checkbox column */}
                        <td className="py-4.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(account.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, account.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== account.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 accent-violet-600 cursor-pointer"
                          />
                        </td>

                        {/* Identifier (MSSV/MaGV) - CORRECTLY RESOLVED */}
                        <td className="py-4.5 px-4">
                          <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 rounded-lg border border-violet-100 dark:border-violet-900">
                            {account.identifier}
                          </span>
                        </td>

                        {/* User Profile */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                              {account.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                                {account.fullName}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 font-medium">{account.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeVariant(account.role)}`}>
                            {getRoleLabel(account.role)}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-4.5 px-6 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                          {account.createdAt}
                        </td>

                        {/* Active/Locked/Disabled Status Badge */}
                        <td className="py-4.5 px-6">
                          {account.isActive ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100/50 font-bold px-2.5 py-0.5 rounded-full">
                              Hoạt động
                            </Badge>
                          ) : isAccountDisabled ? (
                            <Badge className="bg-slate-50 text-slate-600 border border-slate-250 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-100/50 font-bold px-2.5 py-0.5 rounded-full">
                              Vô hiệu hóa
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-450 hover:bg-rose-100/50 font-bold px-2.5 py-0.5 rounded-full">
                              Bị khóa
                            </Badge>
                          )}
                        </td>

                        {/* Premium Row action dropdown menu */}
                        <td className="py-4.5 px-6 text-right relative overflow-visible">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === account.id ? null : account.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                              title="Tùy chọn thao tác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Absolute Popover Dropdown menu */}
                            {activeMenuId === account.id && (
                              <div
                                className="absolute right-6 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setViewingAccount(account);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-4.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                    Xem chi tiết
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleOpenReset(account);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-4.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                    Đặt lại mật khẩu
                                  </button>
                                </div>
                                <div className="py-1">
                                  {/* Lock / Unlock Toggle Action */}
                                  {account.isActive ? (
                                    <button
                                      onClick={() => {
                                        setConfirmAction({
                                          type: 'LOCK',
                                          accountId: account.id,
                                          accountName: account.fullName
                                        });
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      Khóa tài khoản
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setConfirmAction({
                                          type: 'UNLOCK',
                                          accountId: account.id,
                                          accountName: account.fullName
                                        });
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Unlock className="w-3.5 h-3.5" />
                                      Mở khóa tài khoản
                                    </button>
                                  )}

                                  {/* Deactivate / Activate Action */}
                                  {isAccountDisabled ? (
                                    <button
                                      onClick={() => {
                                        setConfirmAction({
                                          type: 'ACTIVATE',
                                          accountId: account.id,
                                          accountName: account.fullName
                                        });
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Kích hoạt lại
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setConfirmAction({
                                          type: 'DEACTIVATE',
                                          accountId: account.id,
                                          accountName: account.fullName
                                        });
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                      Vô hiệu hóa tài khoản
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground font-medium">
                      <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      Không tìm thấy tài khoản tương thích nào!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4.5 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/10">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg px-2.5 h-9"
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 p-0 rounded-lg font-bold ${currentPage === i + 1 ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md' : ''
                    }`}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg px-2.5 h-9"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewingAccount !== null} onOpenChange={(open) => !open && setViewingAccount(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" /> Chi tiết tài khoản người dùng
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-400 text-xs">
              Thông tin chi tiết được ghi nhận trên hệ thống.
            </DialogDescription>
          </DialogHeader>

          {viewingAccount && (
            <div className="space-y-4.5 py-3 text-left">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="w-14 h-14 rounded-full bg-indigo-55 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-2xl flex items-center justify-center border border-indigo-200 dark:border-indigo-850">
                  {viewingAccount.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-800 dark:text-slate-100 leading-tight">
                    {viewingAccount.fullName}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">{viewingAccount.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã số định danh:</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    {viewingAccount.identifier}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vai trò:</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${getRoleBadgeVariant(viewingAccount.role)}`}>
                    {getRoleLabel(viewingAccount.role)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Số điện thoại:</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {viewingAccount.phone}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Trạng thái:</span>
                  <span className="text-xs font-bold">
                    {viewingAccount.isActive ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Đang hoạt động</span>
                    ) : isDeactivated(viewingAccount.id) ? (
                      <span className="text-slate-500">Đã vô hiệu hóa</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-455">Bị khóa hệ thống</span>
                    )}
                  </span>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngày tạo tài khoản:</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {viewingAccount.createdAt}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={() => setViewingAccount(null)}
              className="rounded-xl font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM SECURITY ACTION DIALOG */}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600 dark:text-rose-455">
              <ShieldAlert className="w-5 h-5" /> Xác nhận thực thi hành động
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-400 text-xs">
              Thao tác này thay đổi trạng thái đăng nhập và bảo mật của người dùng trên toàn hệ thống.
            </DialogDescription>
          </DialogHeader>

          {confirmAction && (
            <div className="py-4 text-left space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {confirmAction.type === 'LOCK' && (
                  <p>Bạn có chắc chắn muốn <span className="text-rose-600 font-extrabold">KHÓA</span> tài khoản của người dùng <span className="font-bold underline">{confirmAction.accountName}</span> không?</p>
                )}
                {confirmAction.type === 'UNLOCK' && (
                  <p>Bạn có chắc chắn muốn <span className="text-emerald-600 font-extrabold">MỞ KHÓA</span> tài khoản của người dùng <span className="font-bold underline">{confirmAction.accountName}</span> không?</p>
                )}
                {confirmAction.type === 'DEACTIVATE' && (
                  <p>Bạn có chắc chắn muốn <span className="text-slate-500 font-extrabold">VÔ HIỆU HÓA</span> tài khoản của người dùng <span className="font-bold underline">{confirmAction.accountName}</span> không?</p>
                )}
                {confirmAction.type === 'ACTIVATE' && (
                  <p>Bạn có chắc chắn muốn <span className="text-emerald-600 font-extrabold">KÍCH HOẠT LẠI</span> tài khoản của người dùng <span className="font-bold underline">{confirmAction.accountName}</span> không?</p>
                )}

                {confirmAction.type === 'LOCK_BULK' && (() => {
                  const { eligible, skipped, skipReason } = getBulkActionCounts('LOCK_BULK');
                  return (
                    <>
                      <p>Bạn có chắc chắn muốn <span className="text-rose-600 font-extrabold">KHÓA</span> các tài khoản đã chọn không?</p>
                      <div className="mt-3 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Tổng số đã chọn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIds.length} tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600 font-bold">Hợp lệ để khóa:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{eligible} tài khoản</span>
                        </div>
                        {skipped > 0 && (
                          <div className="flex justify-between text-rose-600 dark:text-rose-400">
                            <span className="font-bold">Bỏ qua ({skipReason}):</span>
                            <span className="font-bold">{skipped} tài khoản</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {confirmAction.type === 'UNLOCK_BULK' && (() => {
                  const { eligible, skipped, skipReason } = getBulkActionCounts('UNLOCK_BULK');
                  return (
                    <>
                      <p>Bạn có chắc chắn muốn <span className="text-emerald-600 font-extrabold">MỞ KHÓA</span> các tài khoản đã chọn không?</p>
                      <div className="mt-3 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Tổng số đã chọn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIds.length} tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600 font-bold">Hợp lệ để mở khóa:</span>
                          <span className="font-bold text-emerald-600">{eligible} tài khoản</span>
                        </div>
                        {skipped > 0 && (
                          <div className="flex justify-between text-rose-600 dark:text-rose-400">
                            <span className="font-bold">Bỏ qua ({skipReason}):</span>
                            <span className="font-bold">{skipped} tài khoản</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {confirmAction.type === 'RESET_BULK' && (() => {
                  const { eligible } = getBulkActionCounts('RESET_BULK');
                  return (
                    <>
                      <p>Bạn có chắc chắn muốn <span className="text-amber-500 font-extrabold">ĐẶT LẠI MẬT KHẨU</span> đồng thời cho các tài khoản đã chọn không?</p>
                      <div className="mt-3 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Tổng số đã chọn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIds.length} tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600 font-bold">Hợp lệ để đặt lại:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{eligible} tài khoản</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {confirmAction.type === 'DEACTIVATE_BULK' && (() => {
                  const { eligible, skipped, skipReason } = getBulkActionCounts('DEACTIVATE_BULK');
                  return (
                    <>
                      <p>Bạn có chắc chắn muốn <span className="text-slate-500 font-extrabold">VÔ HIỆU HÓA</span> các tài khoản đã chọn không?</p>
                      <div className="mt-3 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Tổng số đã chọn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIds.length} tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-bold">Hợp lệ để vô hiệu hóa:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-350">{eligible} tài khoản</span>
                        </div>
                        {skipped > 0 && (
                          <div className="flex justify-between text-rose-600 dark:text-rose-400">
                            <span className="font-bold">Bỏ qua ({skipReason}):</span>
                            <span className="font-bold">{skipped} tài khoản</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {confirmAction.type === 'ACTIVATE_BULK' && (() => {
                  const { eligible, skipped, skipReason } = getBulkActionCounts('ACTIVATE_BULK');
                  return (
                    <>
                      <p>Bạn có chắc chắn muốn <span className="text-emerald-600 font-extrabold">KÍCH HOẠT LẠI</span> các tài khoản đã chọn không?</p>
                      <div className="mt-3 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Tổng số đã chọn:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIds.length} tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600 font-bold">Hợp lệ để kích hoạt lại:</span>
                          <span className="font-bold text-emerald-600">{eligible} tài khoản</span>
                        </div>
                        {skipped > 0 && (
                          <div className="flex justify-between text-rose-600 dark:text-rose-400">
                            <span className="font-bold">Bỏ qua ({skipReason}):</span>
                            <span className="font-bold">{skipped} tài khoản</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {(confirmAction.type === 'LOCK' || confirmAction.type === 'LOCK_BULK') && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Người dùng sẽ bị đình chỉ quyền truy cập tức thì. Có thể mở khóa sau nếu cần.</span>
                </div>
              )}
              {(confirmAction.type === 'DEACTIVATE' || confirmAction.type === 'DEACTIVATE_BULK') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Dành riêng cho sinh viên đã tốt nghiệp hoặc giảng viên đã nghỉ việc. Mọi lịch sử dữ liệu hoạt động vẫn được bảo toàn nguyên vẹn trên hệ thống.</span>
                </div>
              )}
              {confirmAction.type === 'RESET_BULK' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250/40 rounded-xl text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Mật khẩu của toàn bộ tài khoản được chọn sẽ bị ghi đè thành mật khẩu mặc định <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">123456</code>. Thao tác này không thể hoàn tác.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <button
              type="button"
              onClick={confirmAction?.type.endsWith('_BULK') ? handleExecuteBulkAction : handleExecuteStatusChange}
              className={`inline-flex items-center justify-center rounded-xl text-sm font-bold px-4 h-8 transition-all duration-200 outline-none select-none active:scale-[0.98] shadow-md ${confirmAction?.type === 'UNLOCK' || confirmAction?.type === 'ACTIVATE' || confirmAction?.type === 'UNLOCK_BULK' || confirmAction?.type === 'ACTIVATE_BULK'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10 hover:shadow-rose-600/20'
                }`}
            >
              Xác nhận thực thi
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE ACCOUNT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-500" /> Thêm tài khoản mới
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-400 text-xs">
              Vui lòng nhập đầy đủ thông tin để tạo tài khoản mới. Mật khẩu khởi tạo mặc định sẽ là <code className="font-bold text-violet-500">123456</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="create-name" className="text-xs font-bold text-slate-500">Họ và tên *</Label>
                <Input
                  id="create-name"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="create-role" className="text-xs font-bold text-slate-500">Vai trò hệ thống *</Label>
                <select
                  id="create-role"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="TEACHER">Giảng viên</option>
                  <option value="ACADEMIC_DEPT">Phòng Đào tạo</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="create-id" className="text-xs font-bold text-slate-500">Mã số định danh *</Label>
                <Input
                  id="create-id"
                  value={newIdentifier}
                  onChange={e => setNewIdentifier(e.target.value)}
                  placeholder="Ví dụ: SV201202, GV10023..."
                  className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="create-email" className="text-xs font-bold text-slate-500">Email liên lạc *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="nguyenvana@gmail.com"
                  className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="create-phone" className="text-xs font-bold text-slate-500">Số điện thoại</Label>
                <Input
                  id="create-phone"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="0912345xxx"
                  className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold px-4 h-8 transition-all duration-200 outline-none select-none active:scale-[0.98] shadow-md bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer"
              >
                Xác nhận tạo
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PASSWORD RESET DIALOG */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-5 h-5" /> Đặt lại mật khẩu hệ thống
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-400 text-xs">
              Mật khẩu cũ của tài khoản <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAccount?.fullName} ({selectedAccount?.identifier})</span> sẽ bị vô hiệu hóa hoàn toàn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Hệ thống đã tự động khởi tạo mật khẩu ngẫu nhiên mới:
            </p>
            <div className="flex items-center gap-2 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden group">
              <span className="font-mono text-xl font-extrabold text-violet-600 dark:text-violet-400 tracking-wider">
                {newPasswordValue}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Sao chép mật khẩu"
              >
                {copied ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5 text-slate-400" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              * Vui lòng sao chép mật khẩu này và bấm "Xác nhận Đặt lại" để lưu vào hệ thống trước khi đóng.
            </p>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetOpen(false)}
              className="rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <button
              type="button"
              onClick={confirmReset}
              className="inline-flex items-center justify-center rounded-xl text-sm font-bold px-4 h-8 transition-all duration-200 outline-none select-none active:scale-[0.98] shadow-md bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10 hover:shadow-amber-600/20 cursor-pointer"
            >
              Xác nhận Đặt lại
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
