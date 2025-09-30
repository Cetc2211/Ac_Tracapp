// ...otros imports
import React, { useEffect, useState } from 'react';
// Asegúrate de importar lo necesario según tu proyecto

export default function ReportPage(props) {
  // ...otros estados y lógica

  // Supongo que tienes estas variables y lógica por contexto:
  // const [recoverySummary, setRecoverySummary] = useState<any>(null);
  // const studentsWithRecovery = ...;
  // const recoveryGrades = ...;

  useEffect(() => {
    const recoveryStats = {
      recoveryStudentsCount: Object.keys(recoveryGrades || {}).length,
      approvedOnRecovery: studentsWithRecovery.filter(rg => rg.grade != null && rg.grade >= 60).length,
      failedOnRecovery: studentsWithRecovery.filter(rg => rg.grade != null && rg.grade < 60).length,
    };
    setRecoverySummary(recoveryStats);
  }, [recoveryGrades, studentsWithRecovery]);

  // ...resto de tu componente

  return (
    // ...JSX de tu componente
  );
}
