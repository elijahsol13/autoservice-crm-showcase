"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, Car as CarIcon, AlertCircle, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, ArrowLeft, Edit3, Save, Loader2, X } from "lucide-react";
import { updateOrderSchedule } from "@/app/actions/calendar";

const BAYS = ["Подъемник 1", "Подъемник 2", "Двор / Ожидание"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function CalendarBoard({ orders: initialOrders }: { orders: any[] }) {
    const router = useRouter();

    // Локальный стейт заказов для мгновенного обновления интерфейса
    const [orders, setOrders] = useState(initialOrders);

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<"day" | "week">("day");

    // Стейты для редактирования расписания
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({ bay: "", scheduledAt: "", deadlineAt: "" });

    // Вспомогательные функции для расчета недель
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Начинаем с понедельника
        return new Date(d.setDate(diff));
    };
    const startOfWeek = getStartOfWeek(currentDate);

    const getWeekDays = () => Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const isSameDay = (d1: Date, d2String: string | Date | null) => {
        if (!d2String) return false;
        const d2 = new Date(d2String);
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleString("ru-RU", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    // Форматирование даты под стандарт <input type="datetime-local">
    const toDatetimeLocal = (dateString: string | null) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    // Вычисление позиции карточки в почасовой сетке (9:00 - 21:00)
    const getHourGridStyles = (scheduledAtStr: string | null, deadlineAtStr: string | null) => {
        if (!scheduledAtStr) return { gridColumn: "span 2" };
        const start = new Date(scheduledAtStr);
        const end = deadlineAtStr ? new Date(deadlineAtStr) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

        let startHour = start.getHours() + start.getMinutes() / 60;
        let endHour = end.getHours() + end.getMinutes() / 60;
        if (startHour < 9) startHour = 9;
        if (endHour > 21) endHour = 21;
        if (endHour <= startHour) endHour = startHour + 1;

        return {
            gridColumnStart: Math.round((startHour - 9) * 2) + 1,
            gridColumnEnd: Math.round((endHour - 9) * 2) + 1,
        };
    };

    // Вход в режим редактирования
    const handleEditClick = () => {
        setEditData({
            bay: selectedOrder.bay || "Двор / Ожидание",
            scheduledAt: toDatetimeLocal(selectedOrder.scheduledAt),
            deadlineAt: toDatetimeLocal(selectedOrder.deadlineAt)
        });
        setIsEditing(true);
    };

    // Отправка измененных данных на сервер
    const handleSaveSchedule = async () => {
        setIsSaving(true);
        const payload = {
            bay: editData.bay,
            scheduledAt: editData.scheduledAt ? new Date(editData.scheduledAt) : null,
            deadlineAt: editData.deadlineAt ? new Date(editData.deadlineAt) : null,
        };

        const res = await updateOrderSchedule(selectedOrder.id, payload);

        if (res.success) {
            const updatedOrder = { ...selectedOrder, ...payload };
            setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
            setSelectedOrder(updatedOrder);
            setIsEditing(false);
            router.refresh(); 
        }
        setIsSaving(false);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

            {/* ЛЕВАЯ ЧАСТЬ: ОСНОВНАЯ СЕТКА */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden border-r border-slate-800">

                {/* ПАНЕЛЬ НАВИГАЦИИ И КНОПКА НАЗАД */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-bold shadow-md cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> В  Канбан
                        </button>
                        <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#e67e22]/10 rounded-xl hidden sm:block">
                                <CalendarDays className="w-5 h-5 text-[#e67e22]" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-tight">Расписание</h1>
                                <p className="text-xs text-slate-400">
                                    {viewMode === "day"
                                        ? currentDate.toLocaleDateString("ru-RU", { weekday: 'long', day: 'numeric', month: 'long' })
                                        : `Неделя: ${startOfWeek.toLocaleDateString("ru-RU", { day: 'numeric', month: 'short' })} — ${new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6)).toLocaleDateString("ru-RU", { day: 'numeric', month: 'short' })}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1">
                            <button onClick={() => { const d = new Date(currentDate); viewMode === "day" ? d.setDate(d.getDate() - 1) : d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer">Сегодня</button>
                            <button onClick={() => { const d = new Date(currentDate); viewMode === "day" ? d.setDate(d.getDate() + 1) : d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1 text-xs font-bold uppercase tracking-wider">
                            <button onClick={() => setViewMode("day")} className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${viewMode === "day" ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}>День</button>
                            <button onClick={() => setViewMode("week")} className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${viewMode === "week" ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:text-slate-300"}`}>Неделя</button>
                        </div>
                    </div>
                </div>

                {/* РЕЖИМ: ДЕНЬ */}
                {viewMode === "day" && (
                    <div className="flex-1 flex flex-col bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="grid grid-cols-[160px_1fr] border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <div className="p-3 border-r border-slate-800">Пост / Зона</div>
                            <div className="grid grid-cols-24 p-3 text-center gap-1">
                                {HOURS.map(hour => <div key={hour} className="col-span-2 text-slate-400 font-mono border-l border-slate-800/40 first:border-0">{hour}:00</div>)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                            {BAYS.map(bay => {
                                const dayOrders = orders.filter(o => {
                                    if (bay === "Двор / Ожидание") return !o.bay || o.bay === "Двор / Ожидание";
                                    return o.bay === bay && isSameDay(currentDate, o.scheduledAt);
                                });

                                return (
                                    <div key={bay} className="grid grid-cols-[160px_1fr] min-h-[120px] items-stretch">
                                        <div className="p-3 border-r border-slate-800 bg-slate-900/20 font-bold text-white flex flex-col justify-center gap-1">
                                            <span className="text-sm">{bay}</span>
                                            <span className="text-[10px] text-slate-500 font-normal bg-slate-950 px-2 py-1 rounded w-max">Авто: {dayOrders.length}</span>
                                        </div>

                                        <div className="relative grid grid-cols-24 gap-2 p-2 bg-slate-950/20 items-center">
                                            <div className="absolute inset-0 grid grid-cols-24 pointer-events-none opacity-5">
                                                {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border-r border-white h-full"></div>)}
                                            </div>

                                            {dayOrders.length === 0 ? (
                                                <div className="col-span-24 text-center text-xs italic text-slate-600">Свободно</div>
                                            ) : (
                                                dayOrders.map(order => {
                                                    const gridStyles = getHourGridStyles(order.scheduledAt, order.deadlineAt);
                                                    const isSelected = selectedOrder?.id === order.id;
                                                    const isOverdue = order.deadlineAt && new Date(order.deadlineAt) < new Date() && order.status !== "READY";

                                                    return (
                                                        <div
                                                            key={order.id}
                                                            style={gridStyles}
                                                            onClick={() => setSelectedOrder(order)}
                                                            className={`h-[90%] flex flex-col justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? "bg-slate-800 border-[#e67e22] shadow-[0_0_15px_rgba(230,126,34,0.15)] z-10"
                                                                    : isOverdue
                                                                        ? "bg-red-950/40 border-red-500/50 hover:bg-red-900/40 animate-pulse"
                                                                        : "bg-slate-900 border-slate-700 hover:border-slate-500 opacity-90 hover:opacity-100"
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className="text-[9px] font-mono font-black text-[#e67e22] bg-[#e67e22]/10 px-1.5 py-0.5 rounded border border-[#e67e22]/20 truncate">
                                                                    {order.car.plateNumber}
                                                                </span>
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${order.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            </div>
                                                            <div className="text-[11px] font-bold text-white truncate mt-1">
                                                                {order.car.brand} {order.car.model}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* РЕЖИМ: НЕДЕЛЯ */}
                {viewMode === "week" && (
                    <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto pr-1">
                        {getWeekDays().map((day, idx) => {
                            const dayOrders = orders.filter(o => isSameDay(day, o.scheduledAt) || (!o.scheduledAt && idx === 0 && !o.bay));
                            const isToday = isSameDay(new Date(), day);
                            
                            return (
                                <div key={idx} className={`bg-slate-900/40 border ${isToday ? 'border-[#e67e22]/50 bg-[#e67e22]/5' : 'border-slate-800'} rounded-2xl p-2 flex flex-col min-h-[400px]`}>
                                    <div className="text-center pb-2 border-b border-slate-800 mb-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{day.toLocaleDateString("ru-RU", { weekday: 'short' })}</p>
                                        <p className={`text-base font-black mt-0.5 ${isToday ? 'text-[#e67e22]' : 'text-white'}`}>{day.getDate()}</p>
                                    </div>

                                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                                        {dayOrders.length === 0 ? (
                                            <div className="text-center py-4 text-[10px] italic text-slate-600">Пусто</div>
                                        ) : (
                                            dayOrders.map(order => {
                                                const isSelected = selectedOrder?.id === order.id;
                                                const isOverdue = order.deadlineAt && new Date(order.deadlineAt) < new Date() && order.status !== "READY";

                                                return (
                                                    <div 
                                                        key={order.id} 
                                                        onClick={() => setSelectedOrder(order)} 
                                                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? "bg-slate-800 border-[#e67e22]" 
                                                                : isOverdue
                                                                    ? "bg-red-950/40 border-red-500/50 hover:bg-red-900/40"
                                                                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-bold font-mono text-[#e67e22]">{order.car.plateNumber}</span>
                                                            <span className="text-[8px] text-slate-500 truncate max-w-[60px]">{order.bay ? order.bay.replace("Подъемник ", "П") : "Двор"}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white truncate">{order.car.brand} {order.car.model}</p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ПРАВАЯ КАРТОЧКА: ИНСПЕКТОР И РЕДАКТОР */}
            <div className="w-[380px] bg-slate-900 p-6 overflow-y-auto hidden xl:block border-l border-slate-800">
                {!selectedOrder ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center opacity-40">
                        <LayoutGrid className="w-12 h-12 mb-3 text-slate-600" />
                        <p className="text-sm">Выберите машину<br />для настройки расписания</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Заказ-наряд</p>
                                <h2 className="text-2xl font-black text-white">#{selectedOrder.orderNumber}</h2>
                            </div>
                            <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="text-slate-400 hover:text-white bg-slate-950/60 p-2 border border-slate-800 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <CarIcon className="w-4 h-4 text-[#e67e22]" />
                                <div>
                                    <p className="text-sm text-white font-bold">{selectedOrder.car.brand} {selectedOrder.car.model}</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedOrder.car.plateNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* ТУМБЛЕР РЕЖИМОВ: РЕДАКТИРОВАНИЕ / ПРОСМОТР */}
                        {isEditing ? (
                            <div className="bg-slate-950 border border-[#e67e22]/30 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Edit3 className="w-4 h-4 text-[#e67e22]" />
                                    <h3 className="font-bold text-white text-sm">Изменение параметров</h3>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Выбор поста</label>
                                    <select
                                        value={editData.bay}
                                        onChange={e => setEditData({ ...editData, bay: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 outline-none focus:border-[#e67e22]"
                                    >
                                        {BAYS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">План заезда</label>
                                    <input
                                        type="datetime-local"
                                        value={editData.scheduledAt}
                                        onChange={e => setEditData({ ...editData, scheduledAt: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 outline-none focus:border-[#e67e22] [color-scheme:dark]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-[#e67e22] mb-1.5">Дедлайн (Обещан выдать)</label>
                                    <input
                                        type="datetime-local"
                                        value={editData.deadlineAt}
                                        onChange={e => setEditData({ ...editData, deadlineAt: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 outline-none focus:border-[#e67e22] [color-scheme:dark]"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer">
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleSaveSchedule}
                                        disabled={isSaving}
                                        className="flex-[2] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-[#e67e22] hover:bg-[#e67e22]/90 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-[#e67e22]/20"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Сохранить
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Рабочий пост</p>
                                            <span className="inline-block px-3 py-1 bg-slate-800 text-xs font-bold text-white rounded-md border border-slate-700">
                                                {selectedOrder.bay || "Двор / Ожидание"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleEditClick}
                                            className="p-2 bg-slate-900 border border-slate-700 hover:border-[#e67e22] text-slate-400 hover:text-[#e67e22] rounded-lg transition-colors cursor-pointer"
                                            title="Назначить подъемник и время"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 border-t border-slate-800/60 pt-3">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">План Заезда</p>
                                            <p className="text-sm text-slate-200 font-medium">{formatDate(selectedOrder.scheduledAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#e67e22] uppercase font-bold mb-1">Дедлайн выдачи</p>
                                            <p className="text-sm text-[#e67e22] font-black">{formatDate(selectedOrder.deadlineAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Статус дебиторки */}
                                <div className={`p-4 rounded-xl flex items-center justify-between border ${selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                                        {selectedOrder.paymentStatus === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        {selectedOrder.paymentStatus === 'PAID' ? "Оплачено" : "Долг"}
                                    </div>
                                    <span className="text-base font-black">{selectedOrder.totalPrice.toLocaleString("ru-RU")} ₽</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}