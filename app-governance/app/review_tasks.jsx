import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, SafeAreaView, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Platform, StatusBar, Modal,
    TextInput, Animated, Pressable,
} from 'react-native';
import {
    TrafficCone, Droplets, MapPin, Clock, CheckCircle2, XCircle,
    Users, LayoutGrid, ClipboardList, CheckCircle, User, Bell,
    Zap, FileText, Package, Timer, TriangleAlert, ChevronDown,
    ChevronUp, Image as ImageIcon, Star, Shield,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import API from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getCategoryIcon(category, size = 20, color = '#091557') {
    if (category === 'Road') return <TrafficCone color={color} size={size} />;
    if (category === 'Water' || category === 'Waste') return <Droplets color={color} size={size} />;
    if (category === 'Electricity') return <Zap color={color} size={size} />;
    return <Users color={color} size={size} />;
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ visible, onClose, onConfirm, reportTitle }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const quickReasons = [
        'Work is incomplete',
        'Photo quality is too low',
        'Wrong location reported',
        'Materials list missing',
    ];

    const confirm = async () => {
        if (!reason.trim()) {
            Alert.alert('Required', 'Please provide a rejection reason.');
            return;
        }
        setLoading(true);
        await onConfirm(reason.trim());
        setLoading(false);
        setReason('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                onPress={onClose}
            >
                <Pressable onPress={() => {}} style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    padding: 28,
                    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
                }}>
                    {/* Handle */}
                    <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

                    <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                        Reject Submission
                    </Text>
                    <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
                        {reportTitle}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', marginBottom: 20 }}>
                        Select or type a reason. The contractor will be notified.
                    </Text>

                    {/* Quick Reason Chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {quickReasons.map(r => (
                            <TouchableOpacity
                                key={r}
                                onPress={() => setReason(r)}
                                style={{
                                    backgroundColor: reason === r ? '#fee2e2' : '#f1f5f9',
                                    borderWidth: 1,
                                    borderColor: reason === r ? '#dc2626' : 'transparent',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                }}
                            >
                                <Text style={{ color: reason === r ? '#dc2626' : '#475569', fontSize: 12, fontWeight: '700' }}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Reason Input */}
                    <TextInput
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Or type a custom reason..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        style={{
                            backgroundColor: '#f8fafc',
                            borderWidth: 1,
                            borderColor: '#e2e8f0',
                            borderRadius: 16,
                            padding: 14,
                            color: '#0f172a',
                            fontSize: 14,
                            fontWeight: '500',
                            textAlignVertical: 'top',
                            marginBottom: 20,
                            minHeight: 80,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#64748b', fontWeight: '900', fontSize: 13 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={confirm}
                            disabled={loading}
                            style={{
                                flex: 2, backgroundColor: '#dc2626', borderRadius: 16, paddingVertical: 16,
                                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {loading
                                ? <ActivityIndicator color="white" size="small" />
                                : <>
                                    <XCircle color="white" size={16} />
                                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>Send Rejection</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Full Image Modal ─────────────────────────────────────────────────────────
function FullImageModal({ visible, imageUrl, onClose }) {
    if (!imageUrl) return null;
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity 
                    onPress={onClose}
                    style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 }}
                >
                    <XCircle color="white" size={32} />
                </TouchableOpacity>
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: '80%' }}
                    contentFit="contain"
                />
            </View>
        </Modal>
    );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onApprove, onReject }) {
    const [expanded, setExpanded] = useState(false);
    const [approving, setApproving] = useState(false);
    const [fullImageVisible, setFullImageVisible] = useState(false);

    const isHighPriority = report.isLate;

    const handleApprove = async () => {
        setApproving(true);
        await onApprove(report._id);
        setApproving(false);
    };

    return (
        <View style={{
            backgroundColor: 'white',
            borderRadius: 28,
            marginBottom: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#f1f5f9',
        }}>
            {/* After Image Hero */}
            {report.afterImage && (
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setFullImageVisible(true)}>
                        <Image
                            source={{ uri: report.afterImage }}
                            style={{ width: '100%', height: 180 }}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                    <View style={{
                        position: 'absolute', top: 12, right: 12,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}>
                        <ImageIcon color="white" size={12} />
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>COMPLETION PHOTO</Text>
                    </View>
                    {isHighPriority && (
                        <View style={{
                            position: 'absolute', top: 12, left: 12,
                            backgroundColor: '#ea580c',
                            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                            <TriangleAlert color="white" size={10} />
                            <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>HIGH PRIORITY</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={{ padding: 20 }}>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', flex: 1, marginRight: 8 }}>
                        {!report.afterImage && (
                            <View style={{
                                backgroundColor: '#f1f5f9', width: 48, height: 48,
                                borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12,
                            }}>
                                {getCategoryIcon(report.category)}
                            </View>
                        )}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>
                                {report.category || 'PUBLIC UTILITY'} • #AMC-{report._id?.slice(-4).toUpperCase()}
                            </Text>
                            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900', lineHeight: 24, marginTop: 2 }}>
                                {report.title}
                            </Text>
                        </View>
                    </View>
                    {/* Priority badge (only if no after image, so it doesn't overlap) */}
                    {!report.afterImage && (
                        <View style={{
                            backgroundColor: isHighPriority ? '#ffedd5' : '#f1f5f9',
                            paddingHorizontal: 10, paddingVertical: 6,
                            borderRadius: 12, alignItems: 'center',
                        }}>
                            <Text style={{
                                color: isHighPriority ? '#ea580c' : '#64748b',
                                fontSize: 9, fontWeight: '900', textAlign: 'center', lineHeight: 13
                            }}>
                                {isHighPriority ? 'High\nPriority' : 'Normal\nPriority'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Location & Time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MapPin color="#64748b" size={13} style={{ marginRight: 6 }} />
                    <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500', flex: 1 }}>
                        {report.address || report.location?.locality || 'Location not specified'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <Clock color="#64748b" size={13} style={{ marginRight: 6 }} />
                    <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500' }}>
                        Submitted {timeAgo(report.completionTime)} by Field Unit
                    </Text>
                </View>

                {/* Expandable contractor notes */}
                {(report.description || report.materialsUsed || report.laborHours) && (
                    <TouchableOpacity
                        onPress={() => setExpanded(!expanded)}
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: '#f8fafc', borderRadius: 14,
                            paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
                        }}
                    >
                        <FileText color="#64748b" size={14} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700', flex: 1 }}>Contractor Report</Text>
                        {expanded ? <ChevronUp color="#94a3b8" size={16} /> : <ChevronDown color="#94a3b8" size={16} />}
                    </TouchableOpacity>
                )}

                {expanded && (
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 14, gap: 10 }}>
                        {report.description && (
                            <View>
                                <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Notes</Text>
                                <Text style={{ color: '#334155', fontSize: 13, fontWeight: '500', lineHeight: 20 }}>"{report.description}"</Text>
                            </View>
                        )}
                        {report.materialsUsed && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Package color="#64748b" size={14} />
                                <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>
                                    Materials: <Text style={{ fontWeight: '400' }}>{report.materialsUsed}</Text>
                                </Text>
                            </View>
                        )}
                        {report.laborHours && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Timer color="#64748b" size={14} />
                                <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>
                                    Labor Hours: <Text style={{ fontWeight: '400' }}>{report.laborHours}h</Text>
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {/* Approve / Verify Completion */}
                    <TouchableOpacity
                        onPress={handleApprove}
                        disabled={approving}
                        style={{
                            flex: report.afterImage ? 1.3 : 1,
                            backgroundColor: '#2d3b8e',
                            borderRadius: 999, paddingVertical: 14,
                            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
                            shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
                            elevation: 4,
                        }}
                    >
                        {approving
                            ? <ActivityIndicator color="white" size="small" />
                            : <>
                                {report.afterImage
                                    ? <Shield color="white" size={15} />
                                    : <CheckCircle2 color="white" size={15} />
                                }
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 12 }}>
                                    {report.afterImage ? 'Verify Completion' : 'Approve'}
                                </Text>
                            </>
                        }
                    </TouchableOpacity>

                    {/* Reject */}
                    <TouchableOpacity
                        onPress={() => onReject(report)}
                        style={{
                            flex: 1,
                            backgroundColor: '#fee2e2',
                            borderRadius: 999, paddingVertical: 14,
                            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
                        }}
                    >
                        <XCircle color="#dc2626" size={15} />
                        <Text style={{ color: '#dc2626', fontWeight: '900', fontSize: 12 }}>Reject</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Full Image Modal */}
            <FullImageModal 
                visible={fullImageVisible} 
                imageUrl={report.afterImage} 
                onClose={() => setFullImageVisible(false)} 
            />
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReviewTasks() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ reviewedToday: 24, critical: 8, approvalRate: 92 });

    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportsRes, profileRes, statsRes] = await Promise.all([
                API.get('/reports/pending-review'),
                API.get('/auth/profile'),
                API.get('/reports/review-stats').catch(() => ({ data: null })),
            ]);
            setReports(reportsRes.data);
            setProfile(profileRes.data);
            if (statsRes.data) setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching review tasks:', error);
            Alert.alert('Error', 'Could not load tasks for review.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleApprove = async (taskId) => {
        try {
            await API.put(`/reports/close/${taskId}`);
            setReports(prev => prev.filter(r => r._id !== taskId));
            setStats(prev => ({
                ...prev,
                reviewedToday: prev.reviewedToday + 1,
                approvalRate: Math.min(100, prev.approvalRate),
            }));
        } catch (error) {
            console.error('Error approving task:', error);
            Alert.alert('Error', 'Could not approve the task.');
        }
    };

    const handleRejectPress = (report) => {
        setRejectTarget(report);
        setRejectModalVisible(true);
    };

    const handleRejectConfirm = async (reason) => {
        if (!rejectTarget) return;
        try {
            await API.put(`/reports/reject/${rejectTarget._id}`, { reason });
            setReports(prev => prev.filter(r => r._id !== rejectTarget._id));
        } catch (error) {
            console.error('Error rejecting task:', error);
            Alert.alert('Error', 'Could not reject the task.');
        } finally {
            setRejectTarget(null);
        }
    };

    const avatarUrl = profile?.profilePhoto
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Officer')}&background=091557&color=fff`;

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{
                backgroundColor: '#f8fafc',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            }}>
                {/* Navbar */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }}
                            contentFit="cover"
                        />
                        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>CityGuard</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/officer_notifications')} style={{ position: 'relative' }}>
                        <Bell color="#091557" size={22} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Page Title */}
                <View style={{ marginBottom: 24, paddingTop: 4 }}>
                    <Text style={{
                        color: '#f97316', fontSize: 10, fontWeight: '900',
                        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4
                    }}>
                        Official Verification
                    </Text>
                    <Text style={{ color: '#091557', fontSize: 32, fontWeight: '900', marginBottom: 6, letterSpacing: -0.5 }}>
                        Pending Review
                    </Text>
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
                        Manage and verify civic tasks submitted by the field units of Ahmedabad Digital Infrastructure.
                    </Text>
                </View>

                {/* Report Cards */}
                {loading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <ActivityIndicator size="large" color="#091557" />
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 12 }}>Loading submissions…</Text>
                    </View>
                ) : reports.length === 0 ? (
                    <View style={{
                        backgroundColor: 'white', padding: 40, borderRadius: 32,
                        borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', marginTop: 8,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
                    }}>
                        <View style={{ backgroundColor: '#f1f5f9', width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                            <CheckCircle2 color="#cbd5e1" size={36} />
                        </View>
                        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 6 }}>All Caught Up!</Text>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
                            No tasks pending your review. Check back soon.
                        </Text>
                    </View>
                ) : (
                    reports.map(report => (
                        <ReportCard
                            key={report._id}
                            report={report}
                            onApprove={handleApprove}
                            onReject={handleRejectPress}
                        />
                    ))
                )}

                {/* Stats Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
                    {[
                        { value: stats.reviewedToday ?? 24, label: 'REVIEWED\nTODAY', accent: false },
                        { value: stats.critical ?? 8, label: 'CRITICAL\nTASKS', accent: true },
                        { value: `${stats.approvalRate ?? 92}%`, label: 'APPROVAL\nRATE', accent: false },
                        { value: '12m', label: 'AVG REVIEW\nTIME', accent: false },
                    ].map((s, i) => (
                        <View key={i} style={{
                            backgroundColor: 'white',
                            width: '48%',
                            borderRadius: 20,
                            paddingVertical: 18,
                            alignItems: 'center',
                            marginBottom: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                            borderWidth: 1,
                            borderColor: s.accent ? '#fdba74' : '#f1f5f9',
                            borderLeftWidth: s.accent ? 4 : 1,
                            borderLeftColor: s.accent ? '#f97316' : '#f1f5f9',
                        }}>
                            <Text style={{ color: '#091557', fontSize: 26, fontWeight: '900' }}>{s.value}</Text>
                            <Text style={{
                                color: '#94a3b8', fontSize: 9, fontWeight: '900',
                                letterSpacing: 1.5, textTransform: 'uppercase',
                                marginTop: 4, textAlign: 'center', lineHeight: 14,
                            }}>
                                {s.label}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Nav */}
            <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'white',
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 32 : 16,
                paddingHorizontal: 8,
                flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
                borderTopLeftRadius: 28, borderTopRightRadius: 28,
                shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.06, shadowRadius: 20, elevation: 15,
            }}>
                <TouchableOpacity
                    style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}
                    onPress={() => router.push('/officer_dashboard')}
                >
                    <LayoutGrid color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>DASHBOARD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}
                    onPress={() => router.push('/assigned_tasks')}
                >
                    <ClipboardList color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>TASKS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{
                    alignItems: 'center',
                    backgroundColor: '#3730a3',
                    paddingHorizontal: 16, paddingVertical: 10,
                    borderRadius: 16,
                }}>
                    <CheckCircle color="white" size={20} />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>REVIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}
                    onPress={() => router.push('/officer_profile')}
                >
                    <User color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>PROFILE</Text>
                </TouchableOpacity>
            </View>

            {/* Reject Modal */}
            <RejectModal
                visible={rejectModalVisible}
                onClose={() => {
                    setRejectModalVisible(false);
                    setRejectTarget(null);
                }}
                onConfirm={handleRejectConfirm}
                reportTitle={rejectTarget?.title || ''}
            />
        </View>
    );
}
