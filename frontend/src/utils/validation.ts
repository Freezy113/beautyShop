export interface FieldErrors {
  [key: string]: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => boolean>): FieldErrors => {
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(rules)) {
    if (!rule(data[field])) {
      switch (field) {
        case 'email':
          errors[field] = 'Введите корректный email';
          break;
        case 'password':
          errors[field] = 'Пароль должен быть не менее 6 символов';
          break;
        case 'name':
          errors[field] = 'Имя обязательно';
          break;
        case 'phone':
          errors[field] = 'Введите корректный номер телефона';
          break;
        default:
          errors[field] = 'Обязательное поле';
      }
    }
  }

  return errors;
};