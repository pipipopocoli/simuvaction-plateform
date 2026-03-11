export const MEETING_DATA_CHANGED_EVENT = "simuvaction:meeting-data-changed";

export function emitMeetingDataChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(MEETING_DATA_CHANGED_EVENT));
}

export function subscribeMeetingDataChanged(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener: EventListener = () => callback();
  window.addEventListener(MEETING_DATA_CHANGED_EVENT, listener);

  return () => {
    window.removeEventListener(MEETING_DATA_CHANGED_EVENT, listener);
  };
}
