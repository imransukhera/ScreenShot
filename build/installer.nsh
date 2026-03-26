; Kill running Desktop Monitor process before installing
; This prevents "cannot be closed" error during reinstall
!macro customInstall
  nsExec::Exec 'taskkill /F /IM "Desktop Monitor.exe"'
  Sleep 2000
!macroend

!macro customUnInstall
  nsExec::Exec 'taskkill /F /IM "Desktop Monitor.exe"'
  Sleep 1000
!macroend
