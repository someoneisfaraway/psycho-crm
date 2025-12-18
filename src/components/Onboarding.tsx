import React, { useState } from 'react';
import { Button } from './ui/Button';
import { supabase } from '../config/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  const slides = [
    {
      title: 'Добро пожаловать',
      description: 'CRM для управления частной практикой',
      icon: '👋',
      action: 'Далее',
    },
    {
      title: 'Создайте первого клиента',
      description: "Нажмите на вкладку 'Клиенты' и добавьте информацию",
      icon: '👥',
      action: 'Далее',
    },
    {
      title: 'Запланируйте сессию',
      description: 'На календаре создавайте сессии и отслеживайте оплату',
      icon: '📅',
      action: 'Начать работу',
    },
  ];

  const markOnboardingComplete = async () => {
    try {
      setSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) {
        onComplete();
        return;
      }
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', uid);
      if (updateError) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ id: uid, onboarding_completed: true }, { onConflict: 'id' } as any);
        if (upsertError) {
          onComplete();
          return;
        }
      }
    } catch {
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-40">
      <div className="modal-container w-full max-w-md p-6 text-center">
        <span className="text-6xl">{slides[currentSlide].icon}</span>
        <h2 className="modal-title mt-4">{slides[currentSlide].title}</h2>
        <p className="text-text-secondary mt-2">{slides[currentSlide].description}</p>
        <div className="flex gap-2 mt-6 justify-center">
          <Button variant="secondary" onClick={markOnboardingComplete} disabled={saving}>
            Пропустить
          </Button>
          <Button
            onClick={() => {
              if (currentSlide < slides.length - 1) {
                setCurrentSlide(currentSlide + 1);
              } else {
                markOnboardingComplete();
              }
            }}
            disabled={saving}
          >
            {slides[currentSlide].action}
          </Button>
        </div>
      </div>
    </div>
  );
};
