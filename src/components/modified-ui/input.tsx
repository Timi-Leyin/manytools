import React, { type ReactNode } from "react";
import classNames from "classnames";
import { Input as UIInput } from "../ui/input";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerclassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  className,
  leftIcon,
  rightIcon,
  containerclassName,
  ...props
}) => {
  return (
    <div
      className={classNames(
        "border flex items-center border-border rounded-lg px-4 py-1 focus-within:border-accent focus:outline-none transition-all bg-background",
        containerclassName
      )}
    >
      {leftIcon}
      <UIInput
        className={classNames("text-sm !px-2 border-none", className)}
        {...props}
      />
      {rightIcon}
    </div>
  );
};
