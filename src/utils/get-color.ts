import { COLORS } from "../config";

export const getColor = (index: number) => {
    return COLORS[index % (COLORS.length - 1)];
}
