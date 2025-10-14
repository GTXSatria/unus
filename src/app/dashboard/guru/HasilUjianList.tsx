// Di dalam komponen yang menampilkan hasil ujian
const handleDeleteByKelas = async (kelas: string) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus semua hasil ujian di kelas ${kelas}?`)) {
    return
  }

  try {
    const response = await fetch(`/api/hasil-ujian/kelas/${kelas}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      alert(data.message)
      // Refresh daftar hasil ujian
      fetchHasilUjian()
    } else {
      const errorData = await response.json()
      alert(errorData.message || 'Gagal menghapus hasil ujian')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Terjadi kesalahan saat menghapus hasil ujian')
  }
}

// Di dalam render, tambahkan tombol delete untuk setiap kelas
<div className="kelas-item">
  <h3>{kelas}</h3>
  <p>Jumlah hasil ujian: {hasilUjianCount}</p>
  <button 
    onClick={() => handleDeleteByKelas(kelas)}
    className="delete-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
  >
    Hapus Semua Hasil Ujian di Kelas Ini
  </button>
</div>