"""
Content Bandit - Multi-Armed Bandit for Content Type Optimization
Uses epsilon-greedy algorithm to learn which content types work best for each student
"""
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime


class ContentBandit:
    """
    Multi-Armed Bandit for optimizing content type selection
    
    Arms: video, text, interactive, quiz
    Uses epsilon-greedy exploration strategy
    """
    
    CONTENT_TYPES = ['video', 'text', 'interactive', 'quiz']
    
    def __init__(self, epsilon: float = 0.1):
        """
        Initialize ContentBandit
        
        Args:
            epsilon: Exploration rate (0-1). Higher = more exploration
        """
        self.epsilon = epsilon
        self.arm_values = {ct: 0.5 for ct in self.CONTENT_TYPES}  # Initial optimistic values
        self.arm_pulls = {ct: 0 for ct in self.CONTENT_TYPES}
        self.arm_rewards = {ct: 0.0 for ct in self.CONTENT_TYPES}
        self.total_pulls = 0
        
    def select_content_type(self, available_types: List[str] = None) -> str:
        """
        Select content type using epsilon-greedy strategy
        
        Args:
            available_types: List of available content types (None = all types)
        
        Returns:
            Selected content type
        """
        if available_types is None:
            available_types = self.CONTENT_TYPES
        
        # Epsilon-greedy selection
        if np.random.random() < self.epsilon:
            # Explore: random selection
            return np.random.choice(available_types)
        else:
            # Exploit: best known content type
            best_type = None
            best_value = -float('inf')
            
            for content_type in available_types:
                if content_type in self.arm_values:
                    if self.arm_values[content_type] > best_value:
                        best_value = self.arm_values[content_type]
                        best_type = content_type
            
            return best_type if best_type else np.random.choice(available_types)
    
    def update(self, content_type: str, reward: float):
        """
        Update bandit state after observing reward
        
        Args:
            content_type: Type of content that was selected
            reward: Observed reward (0-1 scale)
        """
        if content_type not in self.CONTENT_TYPES:
            return
        
        # Update pull count
        self.arm_pulls[content_type] += 1
        self.total_pulls += 1
        
        # Update total reward
        self.arm_rewards[content_type] += reward
        
        # Update arm value (running average)
        self.arm_values[content_type] = (
            self.arm_rewards[content_type] / self.arm_pulls[content_type]
        )
    
    def get_best_content_type(self) -> Tuple[str, float]:
        """
        Get content type with highest expected reward
        
        Returns:
            Tuple of (content_type, expected_reward)
        """
        best_type = max(self.arm_values, key=self.arm_values.get)
        return best_type, self.arm_values[best_type]
    
    def get_arm_values(self) -> Dict[str, float]:
        """
        Get current arm values (expected rewards for each content type)
        
        Returns:
            Dictionary mapping content type to expected reward
        """
        return self.arm_values.copy()
    
    def get_pull_counts(self) -> Dict[str, int]:
        """
        Get number of times each arm has been pulled
        
        Returns:
            Dictionary mapping content type to pull count
        """
        return self.arm_pulls.copy()
    
    def get_statistics(self) -> Dict:
        """Get bandit statistics"""
        return {
            'total_pulls': self.total_pulls,
            'arm_values': self.arm_values.copy(),
            'arm_pulls': self.arm_pulls.copy(),
            'arm_rewards': self.arm_rewards.copy(),
            'epsilon': self.epsilon,
            'best_content_type': self.get_best_content_type()[0]
        }
    
    def load_state(self, bandit_state):
        """
        Load state from BanditState database model
        
        Args:
            bandit_state: BanditState model instance
        """
        self.epsilon = bandit_state.epsilon
        self.total_pulls = bandit_state.total_pulls
        
        # Load arm values
        self.arm_values = {
            'video': bandit_state.video_arm_value,
            'text': bandit_state.text_arm_value,
            'interactive': bandit_state.interactive_arm_value,
            'quiz': bandit_state.quiz_arm_value
        }
        
        # Load pull counts
        self.arm_pulls = {
            'video': bandit_state.video_pulls,
            'text': bandit_state.text_pulls,
            'interactive': bandit_state.interactive_pulls,
            'quiz': bandit_state.quiz_pulls
        }
        
        # Load total rewards
        self.arm_rewards = {
            'video': bandit_state.video_total_reward,
            'text': bandit_state.text_total_reward,
            'interactive': bandit_state.interactive_total_reward,
            'quiz': bandit_state.quiz_total_reward
        }
    
    def save_state(self, bandit_state):
        """
        Save current state to BanditState database model
        
        Args:
            bandit_state: BanditState model instance to update
        """
        # Save arm values
        bandit_state.video_arm_value = self.arm_values['video']
        bandit_state.text_arm_value = self.arm_values['text']
        bandit_state.interactive_arm_value = self.arm_values['interactive']
        bandit_state.quiz_arm_value = self.arm_values['quiz']
        
        # Save pull counts
        bandit_state.video_pulls = self.arm_pulls['video']
        bandit_state.text_pulls = self.arm_pulls['text']
        bandit_state.interactive_pulls = self.arm_pulls['interactive']
        bandit_state.quiz_pulls = self.arm_pulls['quiz']
        
        # Save total rewards
        bandit_state.video_total_reward = self.arm_rewards['video']
        bandit_state.text_total_reward = self.arm_rewards['text']
        bandit_state.interactive_total_reward = self.arm_rewards['interactive']
        bandit_state.quiz_total_reward = self.arm_rewards['quiz']
        
        # Save metadata
        bandit_state.epsilon = self.epsilon
        bandit_state.total_pulls = self.total_pulls
        bandit_state.last_updated = datetime.utcnow()


def calculate_content_reward(
    is_correct: bool,
    time_spent: float,
    engagement_score: float = None
) -> float:
    """
    Calculate reward for content interaction
    
    Args:
        is_correct: Whether answer was correct
        time_spent: Time spent on content (seconds)
        engagement_score: Optional engagement metric (0-1)
    
    Returns:
        Reward value (0-1 scale)
    """
    reward = 0.0
    
    # Base reward from correctness
    if is_correct:
        reward += 0.6
    else:
        reward += 0.1  # Small reward for attempting
    
    # Time-based reward (optimal time = good engagement)
    # Assume optimal time is 60-300 seconds
    if 60 <= time_spent <= 300:
        reward += 0.2
    elif time_spent < 60:
        reward += 0.1  # Too fast (possibly guessing)
    else:
        reward += 0.15  # Slow but engaged
    
    # Engagement bonus
    if engagement_score is not None:
        reward += engagement_score * 0.2
    
    return min(1.0, reward)  # Cap at 1.0
