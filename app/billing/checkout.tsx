import { Ionicons } from "@expo/vector-icons";
import type {
    AgreementWidgetControl,
    PaymentMethodWidgetControl,
} from "@tosspayments/widget-sdk-react-native";
import {
    AgreementWidget,
    PaymentMethodWidget,
    PaymentWidgetProvider,
    usePaymentWidget,
} from "@tosspayments/widget-sdk-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { PLANS, PlanType, useSubscriptionStore } from "../../src/stores";

// Toss Payments Client Key (테스트용)
const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

function CheckoutContent() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { planId } = useLocalSearchParams<{ planId: PlanType }>();
  const { updateSubscription } = useSubscriptionStore();

  const paymentWidgetControl = usePaymentWidget();
  const [paymentMethodWidgetControl, setPaymentMethodWidgetControl] =
    useState<PaymentMethodWidgetControl | null>(null);
  const [agreementWidgetControl, setAgreementWidgetControl] =
    useState<AgreementWidgetControl | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === planId);

  if (!selectedPlan || selectedPlan.price === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      >
        <View style={styles.errorContainer}>
          <ThemedText>{t("billing.checkout.invalidPlan")}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const generateOrderId = () => {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePayment = async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("billing.checkout.loginRequired"));
      return;
    }

    if (paymentWidgetControl == null || agreementWidgetControl == null) {
      Alert.alert(t("common.error"), t("billing.checkout.notInitialized"));
      return;
    }

    const agreement = await agreementWidgetControl.getAgreementStatus();
    if (agreement.agreedRequiredTerms !== true) {
      Alert.alert(t("common.notice"), t("billing.checkout.agreeRequired"));
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const result = await paymentWidgetControl.requestPayment?.({
        orderId,
        orderName: t("billing.checkout.orderName", {
          plan: t(`plans.${selectedPlan.id}.name`, {
            defaultValue: selectedPlan.name,
          }),
        }),
      });

      if (result?.success) {
        // 결제 성공 - Firestore에 구독 정보 저장
        await updateSubscription(user.uid, planId as PlanType, orderId);
        Alert.alert(
          t("billing.checkout.successTitle"),
          t("billing.checkout.successMessage", {
            plan: t(`plans.${selectedPlan.id}.name`, {
              defaultValue: selectedPlan.name,
            }),
          }),
          [
            {
              text: t("common.confirm"),
              onPress: () => {
                router.back();
                router.back();
              },
            },
          ]
        );
      } else if (result?.fail) {
        Alert.alert(
          t("billing.checkout.failTitle"),
          result.fail.message || t("billing.checkout.failMessage")
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("billing.checkout.errorMessage")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("billing.checkout.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
        >
          <ThemedText type="subtitle" style={styles.summaryTitle}>
            {t("billing.checkout.summaryTitle")}
          </ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {t("billing.checkout.productLabel")}
            </ThemedText>
            <ThemedText style={styles.summaryValue}>
              {t(`plans.${selectedPlan.id}.name`, {
                defaultValue: selectedPlan.name,
              })}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {t("billing.checkout.amountLabel")}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.summaryPrice}>
              {selectedPlan.priceDisplay}
            </ThemedText>
          </View>
        </View>

        {/* Features */}
        <View
          style={[
            styles.featuresCard,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
        >
          <ThemedText type="subtitle" style={styles.featuresTitle}>
            {t("billing.checkout.featuresTitle")}
          </ThemedText>
          {selectedPlan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#28a745" />
              <ThemedText style={styles.featureText}>
                {t(`plans.${selectedPlan.id}.features.${index}`, {
                  defaultValue: feature,
                })}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Payment Method Widget */}
        <View style={styles.paymentSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("billing.checkout.paymentMethods")}
          </ThemedText>
          <PaymentMethodWidget
            selector="payment-methods"
            onLoadEnd={() => {
              paymentWidgetControl
                .renderPaymentMethods("payment-methods", {
                  value: selectedPlan.price,
                })
                .then((control) => {
                  setPaymentMethodWidgetControl(control);
                });
            }}
          />
        </View>

        {/* Agreement Widget */}
        <View style={styles.agreementSection}>
          <AgreementWidget
            selector="agreement"
            onLoadEnd={() => {
              paymentWidgetControl
                .renderAgreement("agreement", {
                  variantKey: "DEFAULT",
                })
                .then((control) => {
                  setAgreementWidgetControl(control);
                });
            }}
          />
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            isProcessing && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          <ThemedText style={styles.payButtonText}>
            {isProcessing
              ? t("billing.checkout.processing")
              : t("billing.checkout.payButton", {
                  price: selectedPlan.priceDisplay,
                })}
          </ThemedText>
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#28a745" />
          <ThemedText style={styles.securityText}>
            {t("billing.checkout.securityNote")}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function CheckoutScreen() {
  const { user } = useAuth();
  const customerKey = user?.uid || "guest";

  return (
    <PaymentWidgetProvider
      clientKey={TOSS_CLIENT_KEY}
      customerKey={customerKey}
    >
      <CheckoutContent />
    </PaymentWidgetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryPrice: {
    color: "#007AFF",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 8,
  },
  featuresCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  featuresTitle: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  paymentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  agreementSection: {
    marginBottom: 24,
  },
  payButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
