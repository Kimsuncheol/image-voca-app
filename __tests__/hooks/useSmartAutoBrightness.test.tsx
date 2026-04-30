import { act, render, waitFor } from "@testing-library/react-native";
import * as Brightness from "expo-brightness";
import { LightSensor } from "expo-sensors";
import React from "react";
import { Text, View } from "react-native";
import { useSmartAutoBrightness } from "../../src/hooks/useSmartAutoBrightness";

type MockLightSensor = typeof LightSensor & {
  __mockState: {
    emit: (illuminance: number) => void;
    reset: () => void;
  };
};

const buildPermissionResponse = (
  status: "granted" | "denied",
): Awaited<ReturnType<typeof Brightness.requestPermissionsAsync>> => ({
  status:
    status === "granted"
      ? Brightness.PermissionStatus.GRANTED
      : Brightness.PermissionStatus.DENIED,
  granted: status === "granted",
  canAskAgain: true,
  expires: "never",
});

function Harness() {
  const state = useSmartAutoBrightness();

  return (
    <View>
      <Text testID="enabled">{String(state.enabled)}</Text>
      <Text testID="permission">{state.permissionStatus ?? "none"}</Text>
      <Text testID="sensor">{String(state.isSensorAvailable)}</Text>
      <Text testID="lux">{state.lux ?? "none"}</Text>
      <Text testID="band">{state.band ?? "none"}</Text>
      <Text testID="brightness">{state.brightness ?? "none"}</Text>
      <Text testID="error">{state.error ?? "none"}</Text>
    </View>
  );
}

describe("useSmartAutoBrightness", () => {
  const brightnessMock = Brightness as jest.Mocked<typeof Brightness>;
  const lightSensorMock = LightSensor as unknown as jest.Mocked<MockLightSensor>;

  beforeEach(() => {
    jest.clearAllMocks();
    lightSensorMock.__mockState.reset();
    brightnessMock.isAvailableAsync.mockResolvedValue(true);
    brightnessMock.requestPermissionsAsync.mockResolvedValue(
      buildPermissionResponse("granted"),
    );
    brightnessMock.getBrightnessAsync.mockResolvedValue(0.5);
    brightnessMock.setBrightnessAsync.mockResolvedValue(undefined);
    brightnessMock.restoreSystemBrightnessAsync.mockResolvedValue(undefined);
    lightSensorMock.isAvailableAsync.mockResolvedValue(true);
  });

  it("requests brightness permission and subscribes to the light sensor on mount", async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(brightnessMock.requestPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(lightSensorMock.addListener).toHaveBeenCalledTimes(1);
    });
  });

  it("does not subscribe when brightness permission is denied", async () => {
    brightnessMock.requestPermissionsAsync.mockResolvedValue(
      buildPermissionResponse("denied"),
    );

    const screen = render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("permission").props.children).toBe("denied");
      expect(screen.getByTestId("enabled").props.children).toBe("false");
      expect(lightSensorMock.addListener).not.toHaveBeenCalled();
    });
  });

  it("handles an unavailable light sensor without crashing", async () => {
    lightSensorMock.isAvailableAsync.mockResolvedValue(false);

    const screen = render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("sensor").props.children).toBe("false");
      expect(screen.getByTestId("error").props.children).toContain(
        "Light sensor is not available",
      );
      expect(lightSensorMock.addListener).not.toHaveBeenCalled();
    });
  });

  it("maps dark, indoor, and bright lux readings to brightness levels", async () => {
    const screen = render(<Harness />);

    await waitFor(() => {
      expect(lightSensorMock.addListener).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      lightSensorMock.__mockState.emit(20);
      await Promise.resolve();
    });

    expect(screen.getByTestId("band").props.children).toBe("dark");
    expect(screen.getByTestId("brightness").props.children).toBe(0.3);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(0.3);

    await act(async () => {
      lightSensorMock.__mockState.emit(100);
      await Promise.resolve();
    });

    expect(screen.getByTestId("band").props.children).toBe("indoor");
    expect(screen.getByTestId("brightness").props.children).toBe(0.6);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(0.6);

    await act(async () => {
      lightSensorMock.__mockState.emit(700);
      await Promise.resolve();
    });

    expect(screen.getByTestId("band").props.children).toBe("bright");
    expect(screen.getByTestId("brightness").props.children).toBe(1);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(1);
  });

  it("keeps brightness stable inside hysteresis bands", async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(lightSensorMock.addListener).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      lightSensorMock.__mockState.emit(45);
      await Promise.resolve();
    });
    await act(async () => {
      lightSensorMock.__mockState.emit(55);
      await Promise.resolve();
    });

    expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledTimes(1);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(0.3);

    await act(async () => {
      lightSensorMock.__mockState.emit(60);
      await Promise.resolve();
    });

    expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledTimes(2);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(0.6);

    await act(async () => {
      lightSensorMock.__mockState.emit(530);
      await Promise.resolve();
    });

    expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledTimes(2);

    await act(async () => {
      lightSensorMock.__mockState.emit(560);
      await Promise.resolve();
    });

    expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledTimes(3);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenLastCalledWith(1);
  });

  it("removes the light sensor listener and restores initial brightness on unmount", async () => {
    const screen = render(<Harness />);

    await waitFor(() => {
      expect(lightSensorMock.addListener).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      lightSensorMock.__mockState.emit(700);
      await Promise.resolve();
    });

    brightnessMock.setBrightnessAsync.mockClear();

    await act(async () => {
      screen.unmount();
      await Promise.resolve();
    });

    const subscription = lightSensorMock.addListener.mock.results[0].value;
    expect(subscription.remove).toHaveBeenCalledTimes(1);
    expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.5);
  });
});
