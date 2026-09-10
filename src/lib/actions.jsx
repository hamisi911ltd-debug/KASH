/* Shared action bus so any view can open a form, edit or delete a
   record, check the current role's permissions, or navigate -
   without threading callbacks through every component. App supplies
   the value. */
import { createContext, useContext } from "react";

export const ActionsContext = createContext(null);

export function useActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useActions must be used within <ActionsContext.Provider>");
  return ctx;
}
