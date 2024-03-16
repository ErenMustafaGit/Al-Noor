import { Image } from "react-native";
import React, { useEffect } from "react";
import { useOnboardingStore } from "./store/onBoardingStore";
import { Redirect } from "expo-router";
import useLanguageStore from "./store/languagesStore";
import { OnboardFlow } from "react-native-onboard";
import * as Location from "expo-location";
import { useLocationStore } from "./store/locationStore";
import { useCityStore } from "./store/cityStore";
import { City } from "../models/city";

const OnboardingScreen = () => {
  const { onboardingCompleted, completeOnboarding } = useOnboardingStore();
  const { language } = useLanguageStore();
  const { setLatitudeLongitude, latitude, longitude } = useLocationStore();
  const { updateCity } = useCityStore();

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLatitudeLongitude(location.coords.latitude, location.coords.longitude);
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchCity = async () => {
      if (latitude === null || longitude === null) return;
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data: City = await response.json();
        console.log(data);
        updateCity(data.city);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCity();
  }, [latitude, longitude]);

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <OnboardFlow
      onDone={() => completeOnboarding()}
      style={{ backgroundColor: "#4c6c53" }}
      pages={[
        {
          title: "Assalamu'alaikum 🌙",
          titleStyle: { fontSize: 23, fontWeight: "700", color: "white" },
          subtitleStyle: { fontSize: 16, color: "white", marginTop: 20 },
          subtitle:
            "Welcome to our ad-free and privacy-focused app made by a Muslim for Muslims. Turn on location to get daily accurate prayers times.",
          imageUri: Image.resolveAssetSource(require("../assets/image1.png"))
            .uri,
        },
        {
          title: "Privacy-Focused and Ad-Free",
          subtitle:
            "Our app prioritizes your privacy and is completely free of advertisements. We believe in providing a safe and respectful environment for all users to practice their faith.",
          imageUri: Image.resolveAssetSource(require("../assets/image2.png"))
            .uri,
          titleStyle: { fontSize: 23, fontWeight: "700", color: "white" },
          subtitleStyle: { fontSize: 16, color: "white", marginTop: 20 },
        },
        {
          title: "Happy Prayers, God Bless",
          subtitle:
            "Wishing you joyful and fulfilling prayers. May Allah bless your journey and grant you peace, prosperity, and happiness. Happy praying!",
          imageUri: Image.resolveAssetSource(require("../assets/image3.png"))
            .uri,
          titleStyle: { fontSize: 23, fontWeight: "700", color: "white" },
          subtitleStyle: { fontSize: 16, color: "white", marginTop: 20 },
        },
        {
          title: "Onboarding Complete! 🌙",
          subtitle:
            "You are now ready to use our app. May Allah bless your journey and grant you peace, prosperity, and happiness. Happy praying!",
          imageUri: Image.resolveAssetSource(require("../assets/image1.png"))
            .uri,
          titleStyle: { fontSize: 23, fontWeight: "700", color: "white" },
          subtitleStyle: { fontSize: 16, color: "white", marginTop: 20 },
        },
      ]}
      type={"fullscreen"}
    />
  );
};

export default OnboardingScreen;
