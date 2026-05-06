import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

/// Company Yöneticiler tab — uses Manager + ManagerPermission + Permission APIs.
/// Shows managers, their departments, and allows permission management.
class CompanyUsersTab extends StatefulWidget {
  final int? companyId;
  const CompanyUsersTab({super.key, this.companyId});
  @override
  State<CompanyUsersTab> createState() => _CompanyUsersTabState();
}

class _CompanyUsersTabState extends State<CompanyUsersTab> {
  final _api = ApiService();

  List<Map<String, dynamic>> _managers = [];
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _permissions = [];
  List<Map<String, dynamic>> _managerPermLinks = [];
  List<Map<String, dynamic>> _drivers = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getManagers(),
        _api.getUsers(),
        _api.getDepartments(),
        _api.getPermissions(),
        _api.getManagerPermissionLinks(),
        _api.getDrivers(),
      ]);
      if (!mounted) return;
      setState(() {
        _users = List<Map<String, dynamic>>.from(results[1]);
        final allManagers = List<Map<String, dynamic>>.from(results[0]);
        if (widget.companyId != null) {
          _managers = allManagers.where((m) {
            final u = _users.firstWhere(
              (user) => user['id'] == m['userId'],
              orElse: () => <String, dynamic>{},
            );
            return u['companyId'] == widget.companyId;
          }).toList();
          
          // Also include role=1 users who don't have a Manager record yet
          final managerUserIds = _managers.map((m) => m['userId']).toSet();
          final orphanManagers = _users.where((u) {
            final cid = (u['companyId'] as num?)?.toInt();
            final role = (u['role'] as num?)?.toInt() ?? (u['roleId'] as num?)?.toInt();
            return cid == widget.companyId && role == 1 && !managerUserIds.contains(u['id']);
          }).toList();
          
          for (final u in orphanManagers) {
            _managers.add({
              'id': null, // no Manager record yet
              'userId': u['id'],
              'departmentId': null,
              'departmentName': null,
              'officeNumber': null,
              '_isOrphan': true,
            });
          }
        } else {
          _managers = allManagers;
        }
        _departments = List<Map<String, dynamic>>.from(results[2]);
        _permissions = List<Map<String, dynamic>>.from(results[3]);
        _managerPermLinks = List<Map<String, dynamic>>.from(results[4]);
        _drivers = List<Map<String, dynamic>>.from(results[5]);
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        kError(context, 'Veriler yüklenemedi: $e');
      }
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  /// Get user info for a manager
  Map<String, dynamic>? _userOf(Map<String, dynamic> m) {
    final uid = m['userId'];
    if (uid == null) return null;
    return _users.cast<Map<String, dynamic>?>().firstWhere(
      (u) => u?['id'] == uid,
      orElse: () => null,
    );
  }

  String _managerName(Map<String, dynamic> m) {
    final u = _userOf(m);
    if (u == null) return 'Bilinmeyen (userId: ${m['userId']})';
    return '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
  }

  String _managerEmail(Map<String, dynamic> m) {
    final u = _userOf(m);
    return u?['email'] ?? '—';
  }

  /// Permission IDs assigned to a given manager (deduplicated)
  Set<int> _permIdsOf(int managerId) {
    return _managerPermLinks
        .where((l) => l['managerId'] == managerId)
        .where((l) => l['permissionId'] != null)
        .map<int>((l) => (l['permissionId'] as num).toInt())
        .toSet();
  }

  /// Permission link record for manager+permission pair
  Map<String, dynamic>? _permLinkOf(int managerId, int permissionId) {
    return _managerPermLinks.cast<Map<String, dynamic>?>().firstWhere(
      (l) => l?['managerId'] == managerId && l?['permissionId'] == permissionId,
      orElse: () => null,
    );
  }

  String _permName(int id) {
    final p = _permissions.cast<Map<String, dynamic>?>().firstWhere(
      (p) => p?['id'] == id,
      orElse: () => null,
    );
    return p?['name'] ?? 'Yetki #$id';
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _managers;
    final q = _search.toLowerCase();
    return _managers.where((m) {
      final name = _managerName(m).toLowerCase();
      final email = _managerEmail(m).toLowerCase();
      final dept = (m['departmentName'] ?? '').toString().toLowerCase();
      return name.contains(q) || email.contains(q) || dept.contains(q);
    }).toList();
  }

  // ── Add / Edit manager ────────────────────────────────────────────────────

  void _openForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;

    // For new manager, we need user info
    final firstName = TextEditingController(
      text: isEdit ? (_userOf(item)?['firstName'] ?? '') : '',
    );
    final lastName = TextEditingController(
      text: isEdit ? (_userOf(item)?['lastName'] ?? '') : '',
    );
    final email = TextEditingController(
      text: isEdit ? _managerEmail(item) : '',
    );
    final password = TextEditingController();
    final officeNumber = TextEditingController(
      text: item?['officeNumber'] ?? '',
    );

    int? selectedDeptId = item?['departmentId'];
    Set<int> selectedPermIds = isEdit && item['id'] != null
        ? _permIdsOf((item['id'] as num).toInt()).toSet()
        : {};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              16,
              16,
              MediaQuery.of(ctx).viewInsets.bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isEdit ? 'Yönetici Düzenle' : 'Yeni Yönetici',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (!isEdit) ...[
                    kField('Ad *', firstName),
                    kField('Soyad', lastName),
                    kField(
                      'E-posta *',
                      email,
                      type: TextInputType.emailAddress,
                    ),
                    kField('Şifre *', password, obscure: true),
                  ] else ...[
                    // Show read-only name for existing manager
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: kBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: kBorder),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.person, color: kBlue, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            _managerName(item),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Department dropdown
                  const Text(
                    'Departman',
                    style: TextStyle(color: kMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<int>(
                    value:
                        _departments
                            .where(
                              (d) =>
                                  widget.companyId == null ||
                                  d['companyId'] == widget.companyId,
                            )
                            .any((d) => d['id'] == selectedDeptId)
                        ? selectedDeptId
                        : null,
                    dropdownColor: kCard,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: fieldDecor('Departman Seçin'),
                    items: _departments
                        .where(
                          (d) =>
                              widget.companyId == null ||
                              d['companyId'] == widget.companyId,
                        )
                        .map(
                          (d) => DropdownMenuItem(
                            value: (d['id'] as num?)?.toInt(),
                            child: Text(d['departmentName'] ?? '—'),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setSt(() => selectedDeptId = v),
                  ),
                  const SizedBox(height: 12),

                  kField('Ofis No', officeNumber),

                  // Permissions checkboxes
                  const Text(
                    'Yetkiler',
                    style: TextStyle(color: kMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: kBg,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      children: _permissions.map((p) {
                        final pid = (p['id'] as num?)?.toInt();
                        if (pid == null) return const SizedBox.shrink();
                        final checked = selectedPermIds.contains(pid);
                        return CheckboxListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            p['name'] ?? 'Yetki #$pid',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                          value: checked,
                          activeColor: kBlue,
                          checkColor: Colors.white,
                          onChanged: (v) => setSt(() {
                            if (v == true)
                              selectedPermIds.add(pid);
                            else
                              selectedPermIds.remove(pid);
                          }),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 14),

                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kBlue,
                          ),
                          onPressed: () async {
                            if (!isEdit &&
                                (firstName.text.isEmpty ||
                                    email.text.isEmpty ||
                                    password.text.isEmpty)) {
                              kError(ctx, 'Ad, E-posta ve Şifre zorunludur');
                              return;
                            }
                            if (selectedDeptId == null) {
                              kError(ctx, 'Departman seçin');
                              return;
                            }

                            try {
                              if (isEdit) {
                                if (item['id'] != null) {
                                  // Existing Manager record — update
                                  await _api.updateManager(item['id'], {
                                    'userId': item['userId'],
                                    'departmentId': selectedDeptId,
                                    'officeNumber': officeNumber.text,
                                    'permissionIds': selectedPermIds.toList(),
                                  });
                                } else {
                                  // Orphan: user exists but no Manager record — create one
                                  await _api.createManager({
                                    'userId': item['userId'],
                                    'departmentId': selectedDeptId,
                                    'officeNumber': officeNumber.text,
                                    'permissionIds': selectedPermIds.toList(),
                                    'parentManagerId': null,
                                  });
                                }
                              } else {
                                final userRes = await _api.createUser({
                                  'role': 1,
                                  'firstName': firstName.text,
                                  'lastName': lastName.text,
                                  'email': email.text,
                                  'passwordHash': password.text,
                                  'phoneNumber': '',
                                  'tcIdentityNumber': '',
                                  'companyId': widget.companyId ?? 1,
                                });
                                final newUserId =
                                    userRes?['id'] ?? userRes?['userId'];
                                if (newUserId == null)
                                  throw Exception(
                                    'Kullanıcı oluşturuldu ama ID alınamadı',
                                  );
                                await _api.createManager({
                                  'userId': newUserId,
                                  'departmentId': selectedDeptId,
                                  'officeNumber': officeNumber.text,
                                  'permissionIds': selectedPermIds.toList(),
                                  'parentManagerId': null,
                                });
                              }

                              if (ctx.mounted) Navigator.pop(ctx);
                              kSuccess(
                                context,
                                isEdit
                                    ? 'Yönetici güncellendi'
                                    : 'Yönetici eklendi',
                              );
                              _load();
                            } catch (e) {
                              if (ctx.mounted)
                                kError(ctx, 'Kayıt sırasında hata: $e');
                            }
                          },
                          child: Text(
                            isEdit ? 'Güncelle' : 'Ekle',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (isEdit) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _confirmDelete(item);
                        },
                        icon: const Icon(
                          Icons.delete_rounded,
                          size: 16,
                          color: Colors.redAccent,
                        ),
                        label: const Text(
                          'Yöneticiyi Sil',
                          style: TextStyle(color: Colors.redAccent),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Delete manager ────────────────────────────────────────────────────────

  void _confirmDelete(Map<String, dynamic> item) {
    final name = _managerName(item);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kCard,
        title: const Text(
          'Yönetici Sil',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          '"$name" yöneticisini silmek istiyor musunuz?',
          style: const TextStyle(color: kMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal', style: TextStyle(color: kMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(context);
              try {
                if (item['id'] != null) {
                  await _api.deleteManager((item['id'] as num).toInt());
                }
                // Also delete the user record if desired
                if (item['userId'] != null && item['id'] == null) {
                  await _api.deleteUser(item['userId']);
                }
                kSuccess(context, 'Yönetici silindi');
                _load();
              } catch (_) {
                kError(context, 'Silme işlemi başarısız');
              }
            },
            child: const Text('Sil', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Permission detail dialog ──────────────────────────────────────────────

  void _showPermissions(Map<String, dynamic> m) {
    final managerId = (m['id'] as num?)?.toInt();
    final permIds = managerId != null ? _permIdsOf(managerId) : <int>{};
    final name = _managerName(m);

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kCard,
        title: Text(
          '$name — Yetkiler',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        content: permIds.isEmpty
            ? const Text(
                'Bu yöneticiye yetki atanmamış.',
                style: TextStyle(color: kMuted),
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: permIds
                    .map(
                      (pid) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.check_circle,
                              color: kGreen,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _permName(pid),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat', style: TextStyle(color: kMuted)),
          ),
        ],
      ),
    );
  }

  // ── Show/Manage Drivers assigned to a manager ──────────────────────────────

  void _showDrivers(Map<String, dynamic> manager) {
    final managerId = (manager['id'] as num?)?.toInt();
    if (managerId == null) {
      kError(context, 'Bu yöneticinin henüz kayıt numarası yok');
      return;
    }
    final mName = _managerName(manager);

    // Driver userId set — only users with a Drivers record
    final driverUserIds = _drivers
        .map((d) => (d['userId'] as num?)?.toInt())
        .toSet();

    // Find drivers (users with driver record) whose parentManagerId == managerId
    final assignedDriverUsers = _users.where((u) {
      final uid = (u['id'] as num?)?.toInt();
      final pmId = (u['parentManagerId'] as num?)?.toInt();
      return driverUserIds.contains(uid) && pmId == managerId;
    }).toList();

    // Unassigned drivers (have driver record, same company, no parentManagerId)
    final unassignedDriverUsers = _users.where((u) {
      final uid = (u['id'] as num?)?.toInt();
      final pmId = u['parentManagerId'];
      final sameCompany =
          widget.companyId == null || u['companyId'] == widget.companyId;
      return driverUserIds.contains(uid) && pmId == null && sameCompany;
    }).toList();

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSt) {
          return AlertDialog(
            backgroundColor: kCard,
            title: Text(
              '$mName — Şoförler',
              style: const TextStyle(color: Colors.white, fontSize: 15),
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Atanmış Şoförler',
                      style: TextStyle(
                        color: kMuted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (assignedDriverUsers.isEmpty)
                      const Text(
                        'Bu yöneticiye atanmış şoför yok.',
                        style: TextStyle(color: kMuted, fontSize: 13),
                      )
                    else
                      ...assignedDriverUsers.map((u) {
                        final name =
                            '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                                .trim();
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: kBg,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: kBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.local_shipping_rounded,
                                color: kBlue,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  name.isEmpty ? '—' : name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () async {
                                  try {
                                    final uid = (u['id'] as num?)?.toInt();
                                    if (uid == null) return;
                                    await _api.updateUser(uid, {
                                          ...Map<String, dynamic>.from(u),
                                          'parentManagerId': null,
                                        });
                                    Navigator.pop(ctx);
                                    kSuccess(
                                      context,
                                      '$name ataması kaldırıldı',
                                    );
                                    _load();
                                  } catch (e) {
                                    kError(ctx, 'Hata: $e');
                                  }
                                },
                                child: const Icon(
                                  Icons.remove_circle,
                                  color: Colors.redAccent,
                                  size: 20,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    const SizedBox(height: 16),
                    const Text(
                      'Atanmamış Şoförler',
                      style: TextStyle(
                        color: kMuted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (unassignedDriverUsers.isEmpty)
                      const Text(
                        'Atanabilecek şoför yok.',
                        style: TextStyle(color: kMuted, fontSize: 13),
                      )
                    else
                      ...unassignedDriverUsers.map((u) {
                        final name =
                            '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                                .trim();
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: kBg,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: kBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.person_add_rounded,
                                color: kGreen,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  name.isEmpty ? '—' : name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () async {
                                  try {
                                    final uid = (u['id'] as num?)?.toInt();
                                    if (uid == null) return;
                                    await _api.updateUser(uid, {
                                          ...Map<String, dynamic>.from(u),
                                          'parentManagerId': managerId,
                                        });
                                    Navigator.pop(ctx);
                                    kSuccess(context, '$name atandı');
                                    _load();
                                  } catch (e) {
                                    kError(ctx, 'Hata: $e');
                                  }
                                },
                                child: const Icon(
                                  Icons.add_circle,
                                  color: kGreen,
                                  size: 20,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Kapat', style: TextStyle(color: kMuted)),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: kInputDec('Yönetici ara...'),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: kBlue),
                onPressed: () => _openForm(),
                icon: const Icon(
                  Icons.add_rounded,
                  size: 18,
                  color: Colors.white,
                ),
                label: const Text(
                  'Yönetici Ekle',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        if (_loading)
          const Expanded(
            child: Center(child: CircularProgressIndicator(color: kBlue)),
          )
        else if (_filtered.isEmpty)
          const Expanded(
            child: Center(
              child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted)),
            ),
          )
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              color: kBlue,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                itemCount: _filtered.length,
                itemBuilder: (_, i) {
                  final m = _filtered[i];
                  final name = _managerName(m);
                  final email = _managerEmail(m);
                  final dept = m['departmentName'] ?? '—';
                  final office = m['officeNumber'] ?? '';
                  final mId = (m['id'] as num?)?.toInt();
                  final permIds = mId != null ? _permIdsOf(mId) : <int>{};

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: kCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: kBlue.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(19),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'Y',
                                style: const TextStyle(
                                  color: kBlue,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name.isEmpty ? '—' : name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  Text(
                                    email,
                                    style: const TextStyle(
                                      color: kBlue,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_vert_rounded,
                                size: 20,
                                color: kMuted,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 30,
                                minHeight: 30,
                              ),
                              color: kCard,
                              onSelected: (val) {
                                switch (val) {
                                  case 'perms':
                                    _showPermissions(m);
                                    break;
                                  case 'drivers':
                                    _showDrivers(m);
                                    break;
                                  case 'edit':
                                    _openForm(item: m);
                                    break;
                                }
                              },
                              itemBuilder: (_) => [
                                const PopupMenuItem(
                                  value: 'perms',
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.shield_rounded,
                                        size: 16,
                                        color: kGreen,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'Yetkiler',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'drivers',
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.local_shipping_rounded,
                                        size: 16,
                                        color: kBlue,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'Şoförler',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'edit',
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.edit_rounded,
                                        size: 16,
                                        color: kMuted,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'Düzenle',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            kBadge(dept, const Color(0xFF7C3AED)),
                            if (office.isNotEmpty) ...[
                              const SizedBox(width: 6),
                              kBadge('Ofis: $office', kMuted),
                            ],
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}
