import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { CalendarMonthGrid } from "../components/calendar/CalendarMonthGrid";
import type { CalendarDayCell } from "../src/utils/calendarStats";

let mockIsDark = false;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: mockIsDark,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, ...props }: { children: React.ReactNode }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text {...props}>{children}</Text>;
  },
}));

const buildCell = (overrides: Partial<CalendarDayCell>): CalendarDayCell => ({
  dateKey: "2026-04-01",
  date: new Date(2026, 3, 1),
  dayNumber: 1,
  isCurrentMonth: true,
  isToday: false,
  isFuture: false,
  isSelected: false,
  activityLevel: 0,
  contributedToStreak: false,
  ...overrides,
});

describe("CalendarMonthGrid", () => {
  beforeEach(() => {
    mockIsDark = false;
  });

  it("applies the requested fills for studied, unstudied, future, today, and selected days", () => {
    const onSelectDate = jest.fn();
    const cells: CalendarDayCell[] = [
      buildCell({
        dateKey: "2026-04-07",
        dayNumber: 7,
        activityLevel: 2,
        isSelected: true,
      }),
      buildCell({
        dateKey: "2026-04-06",
        dayNumber: 6,
      }),
      buildCell({
        dateKey: "2026-04-08",
        dayNumber: 8,
        isToday: true,
        activityLevel: 1,
      }),
      buildCell({
        dateKey: "2026-04-09",
        dayNumber: 9,
        isFuture: true,
      }),
      buildCell({
        dateKey: "2026-03-31",
        date: new Date(2026, 2, 31),
        dayNumber: 31,
        isCurrentMonth: false,
        activityLevel: 3,
      }),
    ];

    const screen = render(
      <CalendarMonthGrid
        monthLabel="April 2026"
        weekdayLabels={["S", "M", "T", "W", "T", "F", "S"]}
        cells={cells}
        onPreviousMonth={jest.fn()}
        onNextMonth={jest.fn()}
        onSelectDate={onSelectDate}
      />,
    );

    expect(screen.getByTestId("calendar-cell-2026-04-07")).toHaveStyle({
      backgroundColor: "#DBEAFE",
      borderColor: "#111827",
      borderWidth: 1.5,
    });
    expect(screen.getByTestId("calendar-cell-2026-04-06")).toHaveStyle({
      backgroundColor: "transparent",
    });
    expect(screen.getByTestId("calendar-cell-2026-04-08")).toHaveStyle({
      backgroundColor: "#007AFF",
    });
    expect(screen.getByTestId("calendar-cell-2026-04-09")).toHaveStyle({
      backgroundColor: "transparent",
    });
    expect(screen.getByTestId("calendar-cell-2026-03-31")).toHaveStyle({
      backgroundColor: "transparent",
    });

    fireEvent.press(screen.getByTestId("calendar-cell-2026-04-07"));
    fireEvent.press(screen.getByTestId("calendar-cell-2026-04-09"));

    expect(onSelectDate).toHaveBeenCalledTimes(1);
    expect(onSelectDate).toHaveBeenCalledWith("2026-04-07");
  });

  it("uses a darker studied fill in dark mode", () => {
    mockIsDark = true;

    const screen = render(
      <CalendarMonthGrid
        monthLabel="April 2026"
        weekdayLabels={["S", "M", "T", "W", "T", "F", "S"]}
        cells={[
          buildCell({
            dateKey: "2026-04-10",
            dayNumber: 10,
            activityLevel: 3,
          }),
        ]}
        onPreviousMonth={jest.fn()}
        onNextMonth={jest.fn()}
        onSelectDate={jest.fn()}
      />,
    );

    expect(screen.getByTestId("calendar-cell-2026-04-10")).toHaveStyle({
      backgroundColor: "#1E3A5F",
    });
  });
});
