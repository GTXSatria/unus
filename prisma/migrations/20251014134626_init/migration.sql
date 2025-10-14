-- CreateTable
CREATE TABLE "Guru" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Siswa_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ujian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kodeUjian" TEXT NOT NULL,
    "namaUjian" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "jumlahSoal" INTEGER NOT NULL,
    "lamaUjian" INTEGER NOT NULL,
    "tipePilihan" TEXT NOT NULL,
    "pdfPath" TEXT,
    "kunciJawaban" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ujian_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HasilUjian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ujianId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "skor" INTEGER NOT NULL,
    "benar" INTEGER NOT NULL,
    "salah" INTEGER NOT NULL,
    "waktuMulai" DATETIME NOT NULL,
    "waktuSelesai" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HasilUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HasilUjian_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guru_email_key" ON "Guru"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_nisn_guruId_key" ON "Siswa"("nisn", "guruId");

-- CreateIndex
CREATE UNIQUE INDEX "Ujian_kodeUjian_key" ON "Ujian"("kodeUjian");
