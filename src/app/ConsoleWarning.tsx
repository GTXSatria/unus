"use client"; // penting, ini menandai client component
import { useEffect } from "react";

export default function ConsoleWarning() {
  useEffect(() => {
    setTimeout(() => {
      console.log("%cHold On!", "font-size:30px;color:red;font-weight:bold;");
      console.log(
        "Jangan paste kode dari orang lain ke console, akun dan data kamu bisa dicuri."
      );
      console.log("%c*gak usah rese lah :)*", "font-size:16px;color:blue;");
    }, 300);
  }, []);

  return null; // tidak menampilkan apa-apa di UI
}
