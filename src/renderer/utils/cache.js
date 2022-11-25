/** @format */

export function setCache(key, value, isSession = false) {
  try {
    const parseValue = JSON.stringify(value);
    if (isSession) {
      sessionStorage.setItem(key, parseValue);
    } else {
      localStorage.setItem(key, parseValue);
    }
    return true;
  } catch (err) {
    return false;
  }
}
export function getCache(key, isSession = false) {
  try {
    let value = null;
    if (isSession) {
      value = sessionStorage.getItem(key);
    } else {
      value = localStorage.getItem(key);
    }
    if (value) {
      const parseValue = JSON.parse(value);
      return parseValue;
    }
  } catch (err) {
    return null;
  }
}
export function deleteCache(key, isSession = false) {
  try {
    if (isSession) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
    return true;
  } catch (err) {
    return false;
  }
}
