import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default async function AdminCheckinsPage() {
  const checkins = await prisma.checkin.findMany({
    take: 50,
    orderBy: { checkinTime: "desc" },
    include: {
      registration: { select: { registrationId: true, fullName: true, province: true } },
      staff: { select: { name: true, staffCode: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">รายการ Check-in</h1>
        <p className="text-muted-foreground text-sm">รายการ Check-in ล่าสุด 50 รายการ</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>จังหวัด</TableHead>
                <TableHead>เจ้าหน้าที่</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkins.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.checkinTime)}</TableCell>
                  <TableCell className="font-mono text-xs">{c.registration.registrationId}</TableCell>
                  <TableCell className="font-medium">{c.registration.fullName}</TableCell>
                  <TableCell>{c.registration.province}</TableCell>
                  <TableCell className="text-sm">{c.staff.name}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {c.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {checkins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูล Check-in
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
